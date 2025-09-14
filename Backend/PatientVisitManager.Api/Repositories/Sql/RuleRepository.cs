using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public class RuleRepository : BaseRepository, IRuleRepository
{
    public RuleRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<int> CreateAsync(Rule r)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"INSERT INTO dbo.rules (RuleName, RulePrice)
                            OUTPUT INSERTED.id
                            VALUES (@N, @P)";
        cmd.Parameters.AddWithValue("@N", r.RuleName);
        cmd.Parameters.AddWithValue("@P", r.RulePrice);
        return (int)await cmd.ExecuteScalarAsync();
    }

    public async Task UpdateAsync(Rule r)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE dbo.rules SET RuleName=@N, RulePrice=@P WHERE id=@Id";
        cmd.Parameters.AddWithValue("@N", r.RuleName);
        cmd.Parameters.AddWithValue("@P", r.RulePrice);
        cmd.Parameters.AddWithValue("@Id", r.Id);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.rules WHERE id=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<Rule?> GetByIdAsync(int id)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, RuleName, RulePrice FROM dbo.rules WHERE id=@Id";
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? new Rule
        {
            Id = r.GetInt32(0),
            RuleName = r.GetString(1),
            RulePrice = r.GetDecimal(2)
        } : null;
    }

    public async Task<IEnumerable<Rule>> GetAllAsync()
    {
        var list = new List<Rule>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, RuleName, RulePrice FROM dbo.rules ORDER BY RuleName";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new Rule
            {
                Id = r.GetInt32(0),
                RuleName = r.GetString(1),
                RulePrice = r.GetDecimal(2)
            });
        }
        return list;
    }
}
