using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Services.Interfaces;
using PatientVisitManager.Api.Security;
using System.Security.Claims;

namespace PatientVisitManager.Api.Controllers;
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) { _auth = auth; }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!RoleNormalizer.TryNormalize(req.Role, out var normalizedRole))
            return BadRequest("Role must be Admin, Doctor, or Receptionist");
        try
        {
            var id = await _auth.RegisterAsync(req.Email.Trim(), req.Password, normalizedRole);
            return Created(string.Empty, new { userId = id, req.Email, Role = normalizedRole });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
        { return Conflict(new { error = ex.Message }); }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Users table not found"))
        { return Problem(statusCode: 500, title: "Database schema missing", detail: ex.Message); }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var (ok, role, token, err) = await _auth.LoginAsync(req.Email, req.Password);
        if (!ok || token == null || role == null) return Unauthorized(new { error = err });
        return new LoginResponse(token, role, req.Email);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var email = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        var (ok, err) = await _auth.ChangePasswordAsync(email!, req.CurrentPassword, req.NewPassword);
        if (!ok) return BadRequest(new { error = err });
        return NoContent();
    }
}
