using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;
using System.Security.Claims;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireReceptionistOrAdmin")]
public class PatientsController : ControllerBase
{
    private readonly IPatientRepository _repo;
    private readonly IActivityLogRepository _log;

    public PatientsController(IPatientRepository repo, IActivityLogRepository log)
    {
        _repo = repo;
        _log = log;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Patient>>> GetAll()
        => Ok(await _repo.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Patient>> Get(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreatePatientDto dto)
    {
        var id = await _repo.CreateAsync(new Patient
        {
            PatientID = dto.patientID,
            PatientName = dto.patientName,
            PatientEmail = dto.patientEmail,
            PatientPhone = dto.patientPhone,
            PatientDescription = dto.patientDescription
        });

        await _log.LogAsync(GetUserId(), $"Created patient {id}");

        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePatientDto dto)
    {
        if (id != dto.patientID) return BadRequest("ID mismatch");

        await _repo.UpdateAsync(new Patient
        {
            PatientID = dto.patientID,
            PatientName = dto.patientName,
            PatientEmail = dto.patientEmail,
            PatientPhone = dto.patientPhone,
            PatientDescription = dto.patientDescription,
            VisitID = dto.visitID
        });

        await _log.LogAsync(GetUserId(), $"Updated patient {id}");

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        await _log.LogAsync(GetUserId(), $"Deleted patient {id}");
        return NoContent();
    }

    // ---------- helpers ----------
    private int? GetUserId()
    {
        var s = User.FindFirstValue(ClaimTypes.NameIdentifier)
             ?? User.FindFirstValue("uid");
        return int.TryParse(s, out var parsed) ? parsed : (int?)null;
    }
}
