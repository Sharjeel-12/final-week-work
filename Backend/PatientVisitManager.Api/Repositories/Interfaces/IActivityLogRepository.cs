namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IActivityLogRepository
{
    // New preferred API
    Task LogAsync(int? userId, string message);

    // Convenience if you only have email
    Task LogByEmailAsync(string userEmail, string message);

    // Backward-compat with your existing callers
    Task LogAsync(string userEmail, string description);
}
