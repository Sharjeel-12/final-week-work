using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingRepository _repo;
    private readonly IVisitNoteRepository _notes;
    private readonly IRuleRepository _rules;

    public BillingController(IBillingRepository repo, IVisitNoteRepository notes, IRuleRepository rules)
    {
        _repo = repo;
        _notes = notes;
        _rules = rules;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Billing>> Get(int id)
    {
        var b = await _repo.GetByIdAsync(id);
        return b is null ? NotFound() : Ok(b);
    }

    [HttpGet("byNote/{notesId:int}")]
    public async Task<ActionResult<Billing>> GetByNote(int notesId)
    {
        var b = await _repo.GetByNotesIdAsync(notesId);
        return b is null ? NotFound() : Ok(b);
    }

    // Create billing for note -> sets finalized=1 atomically
    [HttpPost]
    [Authorize(Policy = "RequireReceptionistOrAdmin")]
    public async Task<ActionResult> Create([FromBody] CreateBillingDto dto)
    {
        // fetch note (and guard finalized via repo)
        var note = await _notes.GetByIdAsync(dto.NotesID);
        if (note is null) return NotFound("VisitNote not found.");

        // derive price from rule if no override
        decimal total = dto.OverrideTotal ?? 0m;
        if (dto.OverrideTotal is null)
        {
            // rule must exist
            var rule = await _rules.GetByIdAsync(note.RuleID);
            if (rule is null) return BadRequest("Rule not found for this note.");
            total = rule.RulePrice;
        }

        var billingId = await _repo.CreateForNoteAsync(dto.NotesID, total);
        return CreatedAtAction(nameof(Get), new { id = billingId }, new { id = billingId });
    }
}
