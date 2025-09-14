using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;
public class DoctorRepository : BaseRepository, IDoctorRepository
{
    public DoctorRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<IEnumerable<Doctor>> GetAllAsync()
    {
        var list = new List<Doctor>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT doctorID, visitID, doctorName, doctorEmail, doctorPhone, specialization FROM dbo.Doctors";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new Doctor { DoctorID = r.GetInt32(0), VisitID = r.IsDBNull(1) ? null : r.GetInt32(1), DoctorName = r.GetString(2), DoctorEmail = r.GetString(3), DoctorPhone = r.GetString(4), Specialization = r.GetString(5) });
        }
        return list;
    }

    public async Task<Doctor?> GetByIdAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT doctorID, visitID, doctorName, doctorEmail, doctorPhone, specialization FROM dbo.Doctors WHERE doctorID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
        {
            return new Doctor { DoctorID = r.GetInt32(0), VisitID = r.IsDBNull(1) ? null : r.GetInt32(1), DoctorName = r.GetString(2), DoctorEmail = r.GetString(3), DoctorPhone = r.GetString(4), Specialization = r.GetString(5) };
        }
        return null;
    }

    public async Task<int> CreateAsync(Doctor d)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"INSERT INTO dbo.Doctors (doctorID, doctorName, doctorEmail, doctorPhone, specialization)
                            OUTPUT INSERTED.doctorID VALUES (@PID,@N,@E,@P,@S)";
        cmd.Parameters.AddWithValue("@PID", d.DoctorID);
        cmd.Parameters.AddWithValue("@N", d.DoctorName);
        cmd.Parameters.AddWithValue("@E", d.DoctorEmail);
        cmd.Parameters.AddWithValue("@P", d.DoctorPhone);
        cmd.Parameters.AddWithValue("@S", d.Specialization);
        var rows = await cmd.ExecuteNonQueryAsync();
        return d.DoctorID;
    }

    public async Task UpdateAsync(Doctor d)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE dbo.Doctors SET visitID=@V, doctorName=@N, doctorEmail=@E, doctorPhone=@P, specialization=@S WHERE doctorID=@Id";
        cmd.Parameters.AddWithValue("@V", (object?)d.VisitID ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@N", d.DoctorName);
        cmd.Parameters.AddWithValue("@E", d.DoctorEmail);
        cmd.Parameters.AddWithValue("@P", d.DoctorPhone);
        cmd.Parameters.AddWithValue("@S", d.Specialization);
        cmd.Parameters.AddWithValue("@Id", d.DoctorID);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.Doctors WHERE doctorID=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
    }
}
