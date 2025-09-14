using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;
using System.Security.Claims;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IBillingRepository _billing;
    private readonly IConfiguration _cfg;

    public PaymentsController(IBillingRepository billing, IConfiguration cfg)
    {
        _billing = billing;
        _cfg = cfg;
    }

    /// POST /api/payments/intent
    /// Body: { notesId, amount? }  // amount optional; if omitted => use full balance
    [HttpPost("intent")]
    public async Task<ActionResult<CreateIntentResponse>> CreateIntent([FromBody] CreateIntentDto dto)
    {
        if (dto is null || dto.NotesId <= 0)
            return BadRequest(new { message = "notesId is required." });

        // Fetch billing summary for this note
        var summary = await _billing.GetSummaryByNotesIdAsync(dto.NotesId);
        if (summary is null)
            return NotFound(new { message = "Billing not found for this visit note." });

        if (summary.Balance <= 0m)
            return BadRequest(new { message = "No balance remaining." });

        // ===== Amount handling (partial payments allowed) =====
        // If client sends dto.Amount, use it (abs), otherwise default to full balance.
        var requested = dto.Amount.HasValue ? Math.Abs(dto.Amount.Value) : summary.Balance;
        if (requested <= 0m)
            return BadRequest(new { message = "Amount must be greater than 0." });

        // Prevent over-payment: charge the lesser of requested vs current balance.
        var amount = Math.Min(requested, summary.Balance);

        // Convert to cents (Stripe requires a long in the smallest currency unit).
        long amountCents = Convert.ToInt64(Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero));
        if (amountCents < 50) // $0.50 minimum charge
            return BadRequest(new { message = "Minimum card charge is $0.50." });

        // ===== Stripe config =====
        var sk = _cfg["Stripe:SecretKey"]?.Trim();
        if (string.IsNullOrWhiteSpace(sk))
            return StatusCode(500, new { message = "Stripe secret key missing." });

        Stripe.StripeConfiguration.ApiKey = sk;

        // ===== Include who initiated this payment so the webhook can populate 'By' =====
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("uid");
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? "";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";

        var options = new Stripe.PaymentIntentCreateOptions
        {
            Amount = amountCents,
            Currency = "usd",
            AutomaticPaymentMethods = new Stripe.PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
            Metadata = new Dictionary<string, string>
        {
            { "billingId", summary.BillingID.ToString() },
            { "notesId", dto.NotesId.ToString() },
            { "postedById", userId ?? "" },     // for webhook -> CreatedBy
            { "postedByEmail", email },         // for webhook -> CreatedByName fallback
            { "postedByRole", role }
        },
            Description = $"VisitNote #{summary.NotesID} payment (Billing #{summary.BillingID})"
        };

        try
        {
            var svc = new Stripe.PaymentIntentService();
            var intent = await svc.CreateAsync(options);

            if (string.IsNullOrWhiteSpace(intent.ClientSecret))
                return StatusCode(502, new { message = "Stripe did not return a client_secret." });

            return Ok(new CreateIntentResponse { ClientSecret = intent.ClientSecret! });
        }
        catch (Stripe.StripeException se)
        {
            var msg = se.StripeError?.Message ?? se.Message;
            return StatusCode(502, new { message = $"Stripe error: {msg}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Unexpected error: {ex.Message}" });
        }
    }



    [HttpPost("cash")]
    public async Task<ActionResult<RecordCashResponse>> RecordCash([FromBody] RecordCashDto dto)
    {
        if (dto is null || dto.NotesId <= 0)
            return BadRequest(new { message = "notesId is required." });
        if (dto.Amount <= 0m)
            return BadRequest(new { message = "Amount must be > 0." });

        // fetch current summary
        var summary = await _billing.GetSummaryByNotesIdAsync(dto.NotesId);
        if (summary is null)
            return NotFound(new { message = "Billing not found for this visit note." });

        // clamp to remaining balance (prevents overpayment in one call)
        var amount = Math.Min(dto.Amount, summary.Balance);
        if (amount <= 0m)
            return BadRequest(new { message = "No balance remaining." });

        // Who is recording this?
        int? uid = null; string? email = null;
        var idStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("uid")?.Value;
        if (int.TryParse(idStr, out var parsed)) uid = parsed;
        email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
             ?? User.Identity?.Name;

        // persist
        await _billing.AddPaymentAsync(summary.BillingID, new BillingPayment
        {
            BillingID = summary.BillingID,
            Amount = amount,
            Method = "cash",
            Reference = string.IsNullOrWhiteSpace(dto.Reference) ? null : dto.Reference!.Trim(),
            CreatedBy = uid,
            CreatedByName = email
        });

        // return updated figures
        var after = await _billing.GetSummaryByNotesIdAsync(dto.NotesId);
        return Ok(new RecordCashResponse
        {
            BillingID = summary.BillingID,
            NewPaid = after?.Paid ?? (summary.Paid + amount),
            NewBalance = after?.Balance ?? Math.Max(0, summary.Balance - amount)
        });
    }


}
