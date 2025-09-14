using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireAdmin")]
public class LoggerController : ControllerBase
{
    // For the assignment we only log via repository; expose a ping endpoint for admins
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true, at = DateTime.UtcNow });
}
