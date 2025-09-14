using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;
using System.Security.Claims;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireDoctorOrAdmin")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorRepository _repo;
    private readonly IActivityLogRepository _log;

    public DoctorsController(IDoctorRepository repo, IActivityLogRepository log)
    {
        _repo = repo;
        _log = log;
    }

    [HttpGet]
    public async Task<IEnumerable<Doctor>> GetAll() => await _repo.GetAllAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Doctor>> Get(int id)
    {
        var d = await _repo.GetByIdAsync(id);
        return d is null ? NotFound() : d;
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateDoctorDto dto)
    {
        var id = await _repo.CreateAsync(new Doctor
        {
            DoctorName = dto.DoctorName,
            DoctorEmail = dto.DoctorEmail,
            DoctorPhone = dto.DoctorPhone,
            Specialization = dto.Specialization,
            DoctorID = dto.doctorID
        });

        await _log.LogAsync(GetUserId(), $"Created doctor {id}");
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDoctorDto dto)
    {
        if (id != dto.DoctorID) return BadRequest("ID mismatch");

        await _repo.UpdateAsync(new Doctor
        {
            DoctorID = dto.DoctorID,
            DoctorName = dto.DoctorName,
            DoctorEmail = dto.DoctorEmail,
            DoctorPhone = dto.DoctorPhone,
            Specialization = dto.Specialization,
            VisitID = dto.VisitID
        });

        await _log.LogAsync(GetUserId(), $"Updated doctor {id}");
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        await _log.LogAsync(GetUserId(), $"Deleted doctor {id}");
        return NoContent();
    }

    // ---- helpers ----
    private int? GetUserId()
    {
        var s = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("uid");
        return int.TryParse(s, out var parsed) ? parsed : (int?)null;
    }
}
