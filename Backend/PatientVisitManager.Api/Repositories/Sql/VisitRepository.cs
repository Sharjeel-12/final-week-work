using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class VisitRepository : BaseRepository, IVisitRepository
{
    public VisitRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<IEnumerable<Visit>> GetAllAsync()
    {
        var list = new List<Visit>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT visitID, visitType, visitTypeID, visitDuration, visitDate, visitTime, visitFee, PatientID, DoctorID, status
FROM dbo.Visits";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            var date = r.GetDateTime(4);
            var time = r.GetTimeSpan(5);
            list.Add(new Visit
            {
                VisitID = r.GetInt32(0),
                VisitType = r.GetString(1),
                VisitTypeID = r.IsDBNull(2) ? null : r.GetInt32(2),
                VisitDuration = r.GetInt32(3),
                VisitDate = date + time,
                VisitTime = time,
                VisitFee = r.GetDecimal(6),
                PatientID = r.GetInt32(7),
                DoctorID = r.GetInt32(8),
                Status = r.IsDBNull(9) ? "pending" : r.GetString(9)
            });
        }
        return list;
    }

    public async Task<Visit?> GetByIdAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT visitID, visitType, visitTypeID, visitDuration, visitDate, visitTime, visitFee, PatientID, DoctorID, status
FROM dbo.Visits WHERE visitID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
        {
            var date = r.GetDateTime(4);
            var time = r.GetTimeSpan(5);
            return new Visit
            {
                VisitID = r.GetInt32(0),
                VisitType = r.GetString(1),
                VisitTypeID = r.IsDBNull(2) ? null : r.GetInt32(2),
                VisitDuration = r.GetInt32(3),
                VisitDate = date + time,
                VisitTime = time,
                VisitFee = r.GetDecimal(6),
                PatientID = r.GetInt32(7),
                DoctorID = r.GetInt32(8),
                Status = r.IsDBNull(9) ? "pending" : r.GetString(9)
            };
        }
        return null;
    }

    public async Task<int> CreateAsync(Visit v)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
INSERT INTO dbo.Visits 
(visitID, visitType, visitTypeID, visitDuration, visitDate, visitTime, visitFee, PatientID, DoctorID, status)
OUTPUT INSERTED.visitID 
VALUES (@VID, @T, @TID, @Dur, @Date, @Time, @Fee, @PID, @DID, @Status)";
        cmd.Parameters.AddWithValue("@VID", v.VisitID);
        cmd.Parameters.AddWithValue("@T", v.VisitType);
        cmd.Parameters.AddWithValue("@TID", (object?)v.VisitTypeID ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Dur", v.VisitDuration);
        cmd.Parameters.AddWithValue("@Date", v.VisitDate.Date);
        cmd.Parameters.AddWithValue("@Time", v.VisitDate.TimeOfDay);
        cmd.Parameters.AddWithValue("@Fee", v.VisitFee);
        cmd.Parameters.AddWithValue("@PID", v.PatientID);
        cmd.Parameters.AddWithValue("@DID", v.DoctorID);
        cmd.Parameters.AddWithValue("@Status", v.Status ?? "pending");
        return (int)await cmd.ExecuteScalarAsync();
    }

    public async Task UpdateAsync(Visit v)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
UPDATE dbo.Visits 
SET visitType=@T, visitTypeID=@TID, visitDuration=@Dur, 
    visitDate=@Date, visitTime=@Time, visitFee=@Fee, 
    PatientID=@PID, DoctorID=@DID, status=@Status
WHERE visitID=@Id";
        cmd.Parameters.AddWithValue("@T", v.VisitType);
        cmd.Parameters.AddWithValue("@TID", (object?)v.VisitTypeID ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Dur", v.VisitDuration);
        cmd.Parameters.AddWithValue("@Date", v.VisitDate.Date);
        cmd.Parameters.AddWithValue("@Time", v.VisitDate.TimeOfDay);
        cmd.Parameters.AddWithValue("@Fee", v.VisitFee);
        cmd.Parameters.AddWithValue("@PID", v.PatientID);
        cmd.Parameters.AddWithValue("@DID", v.DoctorID);
        cmd.Parameters.AddWithValue("@Status", v.Status ?? "pending");
        cmd.Parameters.AddWithValue("@Id", v.VisitID);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.Visits WHERE visitID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        try
        {
            var _ = await cmd.ExecuteNonQueryAsync();
        }
        catch (SqlException ex) when (ex.Number == 547)
        {
            throw new InvalidOperationException("Cannot delete: visit is referenced by one or more patients.", ex);
        }
    }

    public async Task<decimal> GetFeePerMinuteByVisitTypeAsync(string visitType)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT TOP 1 feePerMinute FROM dbo.feeSchedule WHERE VisitType=@T";
        cmd.Parameters.AddWithValue("@T", visitType);
        var res = await cmd.ExecuteScalarAsync();
        return res == null ? 0m : Convert.ToDecimal(res);
    }
}
