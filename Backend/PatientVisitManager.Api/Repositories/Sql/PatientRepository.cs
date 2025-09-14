using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;
public class PatientRepository : BaseRepository, IPatientRepository
{
    public PatientRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<IEnumerable<Patient>> GetAllAsync()
    {
        var list = new List<Patient>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT patientID, visitID, patientName, patientEmail, patientPhone, patientDescription FROM dbo.Patients";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new Patient { PatientID = r.GetInt32(0), VisitID = r.IsDBNull(1) ? null : r.GetInt32(1), PatientName = r.GetString(2), PatientEmail = r.GetString(3), PatientPhone = r.GetString(4), PatientDescription = r.GetString(5) });
        }
        return list;
    }

    public async Task<Patient?> GetByIdAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT patientID, visitID, patientName, patientEmail, patientPhone, patientDescription FROM dbo.Patients WHERE patientID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
        {
            return new Patient { PatientID = r.GetInt32(0), VisitID = r.IsDBNull(1) ? null : r.GetInt32(1), PatientName = r.GetString(2), PatientEmail = r.GetString(3), PatientPhone = r.GetString(4), PatientDescription = r.GetString(5) };
        }
        return null;
    }

    public async Task<int> CreateAsync(Patient p)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"INSERT INTO dbo.Patients (patientID, patientName, patientEmail, patientPhone, patientDescription)
                           VALUES (@PID,@N,@E,@P,@D)";
        cmd.Parameters.AddWithValue("@PID", p.PatientID);
        cmd.Parameters.AddWithValue("@N", p.PatientName);
        cmd.Parameters.AddWithValue("@E", p.PatientEmail);
        cmd.Parameters.AddWithValue("@P", p.PatientPhone);
        cmd.Parameters.AddWithValue("@D", p.PatientDescription);
        try
        {
            var rows = await cmd.ExecuteNonQueryAsync();
            return p.PatientID;
        }
        catch (SqlException ex)
        {
            // Log detailed info or inspect ex.Message and ex.Errors
            throw new Exception($"SQL error: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            // General error catch
            throw new Exception($"General error: {ex.Message}", ex);
        }
    }

    public async Task UpdateAsync(Patient p)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE dbo.Patients SET visitID=@V, patientName=@N, patientEmail=@E, patientPhone=@P, patientDescription=@D WHERE patientID=@Id";
        cmd.Parameters.AddWithValue("@V", (object?)p.VisitID ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@N", p.PatientName);
        cmd.Parameters.AddWithValue("@E", p.PatientEmail);
        cmd.Parameters.AddWithValue("@P", p.PatientPhone);
        cmd.Parameters.AddWithValue("@D", p.PatientDescription);
        cmd.Parameters.AddWithValue("@Id", p.PatientID);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.Patients WHERE patientID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
    }
}
