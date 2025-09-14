using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class BillingRepository : BaseRepository, IBillingRepository
{
    public BillingRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<int> CreateForNoteAsync(int notesId, decimal totalBill)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();

        try
        {
            // Check if already finalized / already has billing
            using (var checkCmd = conn.CreateCommand())
            {
                checkCmd.Transaction = (SqlTransaction)tx;
                checkCmd.CommandText = @"SELECT finalized FROM dbo.visitNotes WHERE notesID=@N";
                checkCmd.Parameters.AddWithValue("@N", notesId);
                var finalized = Convert.ToInt32(await checkCmd.ExecuteScalarAsync() ?? 0) == 1;
                if (finalized) throw new InvalidOperationException("Billing already finalized for this note.");
            }

            int billingId;
            using (var ins = conn.CreateCommand())
            {
                ins.Transaction = (SqlTransaction)tx;
                ins.CommandText = @"INSERT INTO dbo.billing (notesID, totalBill)
                                    OUTPUT INSERTED.billingID
                                    VALUES (@N, @T)";
                ins.Parameters.AddWithValue("@N", notesId);
                ins.Parameters.AddWithValue("@T", totalBill);
                billingId = (int)await ins.ExecuteScalarAsync();
            }

            using (var upd = conn.CreateCommand())
            {
                upd.Transaction = (SqlTransaction)tx;
                upd.CommandText = @"UPDATE dbo.visitNotes SET finalized = 1 WHERE notesID=@N";
                upd.Parameters.AddWithValue("@N", notesId);
                await upd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
            return billingId;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<Billing?> GetByIdAsync(int billingId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT billingID, notesID, totalBill FROM dbo.billing WHERE billingID=@B";
        cmd.Parameters.AddWithValue("@B", billingId);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? new Billing
        {
            BillingID = r.GetInt32(0),
            NotesID = r.GetInt32(1),
            TotalBill = r.GetDecimal(2)
        } : null;
    }

    public async Task<Billing?> GetByNotesIdAsync(int notesId)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"SELECT billingID, notesID, totalBill FROM dbo.billing WHERE notesID=@N";
        cmd.Parameters.AddWithValue("@N", notesId);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? new Billing
        {
            BillingID = r.GetInt32(0),
            NotesID = r.GetInt32(1),
            TotalBill = r.GetDecimal(2)
        } : null;
    }
}
