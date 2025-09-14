using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VisitNotesController : ControllerBase
{
    private readonly IVisitNoteRepository _repo;
    private readonly IRuleRepository _rules; // for validation if needed

    public VisitNotesController(IVisitNoteRepository repo, IRuleRepository rules)
    {
        _repo = repo;
        _rules = rules;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VisitNote>>> GetAll()
        => Ok(await _repo.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VisitNote>> Get(int id)
    {
        var n = await _repo.GetByIdAsync(id);
        return n is null ? NotFound() : Ok(n);
    }

    [HttpGet("byVisit/{visitId:int}")]
    public async Task<ActionResult<VisitNote>> GetByVisit(int visitId)
    {
        var n = await _repo.GetByVisitIdAsync(visitId);
        return n is null ? NotFound() : Ok(n);
    }

    // Receptionist/Admin can create
    [HttpPost]
    [Authorize(Policy = "RequireReceptionistOrAdmin")]
    public async Task<ActionResult> Create([FromBody] CreateVisitNoteDto dto)
    {
        // optional: verify rule exists
        var rule = await _rules.GetByIdAsync(dto.RuleID);
        if (rule is null) return BadRequest("Invalid ruleID.");

        var id = await _repo.CreateAsync(new VisitNote
        {
            VisitID = dto.VisitID,
            VisitNotes = dto.VisitNotes,
            RuleID = dto.RuleID,
            Finalized = false
        });

        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireReceptionistOrAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVisitNoteDto dto)
    {
        if (id != dto.NotesID) return BadRequest("ID mismatch");

        var rule = await _rules.GetByIdAsync(dto.RuleID);
        if (rule is null) return BadRequest("Invalid ruleID.");

        await _repo.UpdateAsync(new VisitNote
        {
            NotesID = dto.NotesID,
            VisitNotes = dto.VisitNotes,
            RuleID = dto.RuleID,
        });

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return NoContent();
    }
}
