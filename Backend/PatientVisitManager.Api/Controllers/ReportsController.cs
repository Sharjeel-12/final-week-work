using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize] // keep your policies if needed
public sealed class ReportsController : ControllerBase
{
    private readonly IReportsRepository _repo;
    public ReportsController(IReportsRepository repo) { _repo = repo; }

    // GET /api/reports/outstanding?asOf=2025-09-14&min=0&q=smith
    [HttpGet("outstanding")]
    public async Task<ActionResult<IEnumerable<OutstandingRowDto>>> Outstanding(
        [FromQuery] DateTime? asOf, [FromQuery] decimal min = 0m, [FromQuery] string? q = null)
    {
        var rows = await _repo.GetOutstandingAsync(asOf, min, string.IsNullOrWhiteSpace(q) ? null : q);
        return Ok(rows);
    }

    // GET /api/reports/collections?on=2025-09-14
    [HttpGet("collections")]
    public async Task<ActionResult<CollectionsResponseDto>> Collections([FromQuery] DateTime? on = null)
    {
        var date = (on ?? DateTime.UtcNow).Date;
        var res = await _repo.GetCollectionsAsync(date);
        return Ok(res);
    }
}
