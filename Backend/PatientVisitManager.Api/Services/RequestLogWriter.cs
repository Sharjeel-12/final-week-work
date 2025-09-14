using System.Data;
using Microsoft.Data.SqlClient;

namespace PatientVisitManager.Api.Services;

public interface IRequestLogWriter
{
    Task WriteAsync(int? userId, string message, DateTime startUtc, DateTime endUtc);
}

public sealed class RequestLogWriter : IRequestLogWriter
{
    private readonly string _connStr;

    public RequestLogWriter(IConfiguration config)
    {
        _connStr = config.GetConnectionString("DefaultConnection")
                   ?? throw new InvalidOperationException("Missing DefaultConnection");
    }

    public async Task WriteAsync(int? userId, string message, DateTime startUtc, DateTime endUtc)
    {
        const string sql = @"
INSERT INTO dbo.RequestLog (UserID, LogMessage, StartTimeUtc, EndTimeUtc, [Date])
VALUES (@UserID, @LogMessage, @StartTimeUtc, @EndTimeUtc, CONVERT(date, @StartTimeUtc));";

        await using var conn = new SqlConnection(_connStr);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.Add("@UserID", SqlDbType.Int).Value = (object?)userId ?? DBNull.Value;
        cmd.Parameters.Add("@LogMessage", SqlDbType.NVarChar, 500).Value = message;
        cmd.Parameters.Add("@StartTimeUtc", SqlDbType.DateTime2).Value = startUtc;
        cmd.Parameters.Add("@EndTimeUtc", SqlDbType.DateTime2).Value = endUtc;

        await cmd.ExecuteNonQueryAsync();
    }
}
