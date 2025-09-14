namespace PatientVisitManager.Api.DTOs;
public record RegisterRequest(string Email, string Password, string Role);
public record LoginRequest(string Email, string Password);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record LoginResponse(string Token, string Role, string Email);
