using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class VisitNoteRepository : BaseRepository, IVisitNoteRepository
{
    public VisitNoteRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<bool> IsVisitScheduledAsync(int visitId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT CASE WHEN status='scheduled' THEN 1 ELSE 0 END FROM dbo.Visits WHERE visitID=@V";
        cmd.Parameters.AddWithValue("@V", visitId);
        var res = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(res ?? 0) == 1;
    }

    public async Task<bool> IsFinalizedAsync(int notesId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT finalized FROM dbo.visitNotes WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@N", notesId);
        var res = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(res ?? 0) == 1;
    }

    public async Task<int> CreateAsync(VisitNote n)
    {
        using var conn = CreateConn(); await conn.OpenAsync();

        // Guard: visit must be scheduled
        if (!await IsVisitScheduledAsync(n.VisitID))
            throw new InvalidOperationException("Visit must be marked 'scheduled' before adding a visit note.");

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
INSERT INTO dbo.visitNotes (visitID, visitNotes, ruleID, finalized)
OUTPUT INSERTED.notesID
VALUES (@V, @Notes, @R, @F)";
        cmd.Parameters.AddWithValue("@V", n.VisitID);
        cmd.Parameters.AddWithValue("@Notes", n.VisitNotes);
        cmd.Parameters.AddWithValue("@R", n.RuleID);
        cmd.Parameters.AddWithValue("@F", n.Finalized ? 1 : 0);
        try
        {
            return (int)await cmd.ExecuteScalarAsync();
        }
        catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601) // unique violation on visitID
        {
            throw new InvalidOperationException("A visit note already exists for this visit.", ex);
        }
    }

    public async Task UpdateAsync(VisitNote n)
    {
        // block updates if finalized
        if (await IsFinalizedAsync(n.NotesID))
            throw new InvalidOperationException("VisitNote is finalized and cannot be edited.");

        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
UPDATE dbo.visitNotes
SET visitNotes=@Notes, ruleID=@R
WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@Notes", n.VisitNotes);
        cmd.Parameters.AddWithValue("@R", n.RuleID);
        cmd.Parameters.AddWithValue("@N", n.NotesID);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int notesId)
    {
        // block deletes if finalized
        if (await IsFinalizedAsync(notesId))
            throw new InvalidOperationException("VisitNote is finalized and cannot be deleted.");

        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.visitNotes WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@N", notesId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<VisitNote?> GetByIdAsync(int notesId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT notesID, visitID, visitNotes, ruleID, finalized
                            FROM dbo.visitNotes WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@N", notesId);
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return null;
        return new VisitNote
        {
            NotesID = r.GetInt32(0),
            VisitID = r.GetInt32(1),
            VisitNotes = r.GetString(2),
            RuleID = r.GetInt32(3),
            Finalized = r.GetInt32(4) == 1
        };
    }

    public async Task<VisitNote?> GetByVisitIdAsync(int visitId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT notesID, visitID, visitNotes, ruleID, finalized
                            FROM dbo.visitNotes WHERE visitID=@V";
        cmd.Parameters.AddWithValue("@V", visitId);
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return null;
        return new VisitNote
        {
            NotesID = r.GetInt32(0),
            VisitID = r.GetInt32(1),
            VisitNotes = r.GetString(2),
            RuleID = r.GetInt32(3),
            Finalized = r.GetInt32(4) == 1
        };
    }

    public async Task<IEnumerable<VisitNote>> GetAllAsync()
    {
        var list = new List<VisitNote>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT notesID, visitID, visitNotes, ruleID, finalized
                            FROM dbo.visitNotes ORDER BY notesID DESC";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new VisitNote
            {
                NotesID = r.GetInt32(0),
                VisitID = r.GetInt32(1),
                VisitNotes = r.GetString(2),
                RuleID = r.GetInt32(3),
                Finalized = r.GetInt32(4) == 1
            });
        }
        return list;
    }
}
