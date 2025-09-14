using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class VisitNoteItemRepository : BaseRepository, IVisitNoteItemRepository
{
    public VisitNoteItemRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<IEnumerable<VisitNoteItem>> GetByNotesAsync(int notesId)
    {
        var list = new List<VisitNoteItem>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT itemID, notesID, ruleID, quantity, unitPrice
                            FROM dbo.visitNoteItems WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@N", notesId);
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new VisitNoteItem
            {
                ItemID = r.GetInt32(0),
                NotesID = r.GetInt32(1),
                RuleID = r.GetInt32(2),
                Quantity = r.GetInt32(3),
                UnitPrice = r.GetDecimal(4)
            });
        }
        return list;
    }

    public async Task<VisitNoteItem?> GetByIdAsync(int itemId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT itemID, notesID, ruleID, quantity, unitPrice
                            FROM dbo.visitNoteItems WHERE itemID=@I";
        cmd.Parameters.AddWithValue("@I", itemId);
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return null;
        return new VisitNoteItem
        {
            ItemID = r.GetInt32(0),
            NotesID = r.GetInt32(1),
            RuleID = r.GetInt32(2),
            Quantity = r.GetInt32(3),
            UnitPrice = r.GetDecimal(4)
        };
    }

    public async Task<int> CreateAsync(VisitNoteItem item)
    {
        // snapshot unit price from rules at insert-time
        using var conn = CreateConn(); await conn.OpenAsync();

        decimal unitPrice;
        using (var price = conn.CreateCommand())
        {
            price.CommandText = "SELECT RulePrice FROM dbo.rules WHERE id=@R";
            price.Parameters.AddWithValue("@R", item.RuleID);
            var tmp = await price.ExecuteScalarAsync();
            if (tmp is null) throw new InvalidOperationException("Invalid RuleID.");
            unitPrice = Convert.ToDecimal(tmp);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
INSERT INTO dbo.visitNoteItems (notesID, ruleID, quantity, unitPrice)
OUTPUT INSERTED.itemID
VALUES (@N, @R, @Q, @P)";
        cmd.Parameters.AddWithValue("@N", item.NotesID);
        cmd.Parameters.AddWithValue("@R", item.RuleID);
        cmd.Parameters.AddWithValue("@Q", item.Quantity);
        cmd.Parameters.AddWithValue("@P", unitPrice);

        try
        {
            return (int)await cmd.ExecuteScalarAsync();
        }
        catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601) // unique (notesID, ruleID)
        {
            throw new InvalidOperationException("This rule already exists on the note. Update quantity instead.", ex);
        }
    }

    public async Task UpdateQuantityAsync(int itemId, int quantity)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE dbo.visitNoteItems SET quantity=@Q WHERE itemID=@I";
        cmd.Parameters.AddWithValue("@Q", quantity);
        cmd.Parameters.AddWithValue("@I", itemId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int itemId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"DELETE FROM dbo.visitNoteItems WHERE itemID=@I";
        cmd.Parameters.AddWithValue("@I", itemId);
        await cmd.ExecuteNonQueryAsync();
    }
    public async Task<int?> GetNotesIdForItemAsync(int itemId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT notesID FROM dbo.visitNoteItems WHERE itemID=@I";
        cmd.Parameters.AddWithValue("@I", itemId);
        var v = await cmd.ExecuteScalarAsync();
        return v == null ? (int?)null : Convert.ToInt32(v);
    }

}
