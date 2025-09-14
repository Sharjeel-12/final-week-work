using System.Data;
using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class ActivityLogRepository : BaseRepository, IActivityLogRepository
{
    public ActivityLogRepository(IConfiguration cfg) : base(cfg) { }

    // === Preferred: log by userId (nullable for anonymous/system actions)
    public async Task LogAsync(int? userId, string message)
    {
        await using var conn = CreateConn();
        await conn.OpenAsync();

        // Use DB clock in UTC to avoid app-server clock skew
        const string sql = @"
INSERT INTO dbo.ActivityLogs (UserID, LogMessage, ActivityTime, ActivityDate)
VALUES (@UserID, @LogMessage, CONVERT(time(3), SYSUTCDATETIME()), CONVERT(date, SYSUTCDATETIME()));";

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        // Avoid AddWithValue surprises
        var pUser = cmd.Parameters.Add("@UserID", SqlDbType.Int);
        pUser.Value = (object?)userId ?? DBNull.Value;

        var trimmed = message?.Length > 500 ? message.Substring(0, 500) : (message ?? string.Empty);
        cmd.Parameters.Add("@LogMessage", SqlDbType.NVarChar, 500).Value = trimmed;

        await cmd.ExecuteNonQueryAsync();
    }

    // === Convenience: log by email (we'll look up the Id)
    public async Task LogByEmailAsync(string userEmail, string message)
    {
        int? userId = null;
        await using var conn = CreateConn();
        await conn.OpenAsync();

        // Lookup user id by email (case-insensitive depends on collation)
        const string getIdSql = "SELECT Id FROM dbo.Users WHERE Email = @Email";
        await using (var getId = conn.CreateCommand())
        {
            getId.CommandText = getIdSql;
            getId.Parameters.Add("@Email", SqlDbType.NVarChar, 256).Value = userEmail ?? string.Empty;
            var idObj = await getId.ExecuteScalarAsync();
            if (idObj != null && idObj != DBNull.Value)
                userId = Convert.ToInt32(idObj);
        }

        // Insert the log row
        const string insSql = @"
INSERT INTO dbo.ActivityLogs (UserID, LogMessage, ActivityTime, ActivityDate)
VALUES (@UserID, @LogMessage, CONVERT(time(3), SYSUTCDATETIME()), CONVERT(date, SYSUTCDATETIME()));";

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = insSql;
        var pUser = cmd.Parameters.Add("@UserID", SqlDbType.Int);
        pUser.Value = (object?)userId ?? DBNull.Value;

        var trimmed = message?.Length > 500 ? message.Substring(0, 500) : (message ?? string.Empty);
        cmd.Parameters.Add("@LogMessage", SqlDbType.NVarChar, 500).Value = trimmed;

        await cmd.ExecuteNonQueryAsync();
    }

    // === Backward compatible shim
    public Task LogAsync(string userEmail, string description)
        => LogByEmailAsync(userEmail, description);
}
