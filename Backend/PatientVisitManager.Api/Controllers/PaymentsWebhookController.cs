using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;
using Stripe; // ensure this using is present

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/payments/webhook")]
[AllowAnonymous] // verified via Stripe signature instead of JWT
public class PaymentsWebhookController : ControllerBase
{
    private readonly IBillingRepository _billing;
    private readonly IConfiguration _cfg;

    public PaymentsWebhookController(IBillingRepository billing, IConfiguration cfg)
    {
        _billing = billing;
        _cfg = cfg;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Handle()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();

        var secret = _cfg["Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(secret))
            return StatusCode(500, "Webhook secret missing.");

        Stripe.Event ev;
        try
        {
            ev = Stripe.EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"],
                secret
            );
        }
        catch
        {
            return BadRequest(); // invalid signature
        }

        if (ev.Type == "payment_intent.succeeded")
        {
            var pi = ev.Data.Object as Stripe.PaymentIntent;
            if (pi != null)
            {
                // 1) billingId from metadata
                if (!pi.Metadata.TryGetValue("billingId", out var billingIdStr) ||
                    !int.TryParse(billingIdStr, out var billingId))
                {
                    return Ok(); // no billing mapped
                }

                // 2) amount in cents
                long cents = 0;

                var amtReceivedProp = pi.GetType().GetProperty("AmountReceived");
                if (amtReceivedProp != null)
                {
                    var val = amtReceivedProp.GetValue(pi);
                    if (val != null && long.TryParse(val.ToString(), out var parsed))
                        cents = parsed;
                }

                if (cents <= 0) cents = pi.Amount; // fallback

                var amount = cents / 100m;

                // 3) user info (if passed in metadata)
                int? createdBy = null;
                string? createdByName = null;
                if (pi.Metadata.TryGetValue("postedById", out var uidStr) &&
                    int.TryParse(uidStr, out var uidParsed))
                    createdBy = uidParsed;
                if (pi.Metadata.TryGetValue("postedByEmail", out var email))
                    createdByName = email;

                // 4) unique reference: use event id
                var reference = ev.Id;

                try
                {
                    await _billing.AddPaymentAsync(billingId, new BillingPayment
                    {
                        BillingID = billingId,
                        Amount = amount,
                        Method = "card",
                        Reference = reference,
                        CreatedBy = createdBy,
                        CreatedByName = createdByName
                    });
                }
                catch
                {
                    // duplicate insert? ignore
                }
            }
        }

        return Ok();
    }

}
