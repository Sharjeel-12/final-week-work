namespace PatientVisitManager.Api.Services.Interfaces;
public interface IAuthService
{
    Task<int> RegisterAsync(string email, string password, string role);
    Task<(bool Ok, string? Role, string? Token, string? Error)> LoginAsync(string email, string password);
    Task<(bool Ok, string? Error)> ChangePasswordAsync(string email, string current, string next);
}
