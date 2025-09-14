using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;
public class FeeScheduleRepository : BaseRepository, IFeeScheduleRepository
{
    public FeeScheduleRepository(IConfiguration cfg) : base(cfg) { }
    public async Task<IEnumerable<FeeSchedule>> GetAllAsync()
    {
        var list = new List<FeeSchedule>();
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT feeID, VisitType, feePerMinute FROM dbo.feeSchedule";
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new FeeSchedule { FeeID = r.GetInt32(0), VisitType = r.GetString(1), FeePerMinute = r.GetDecimal(2) });
        }
        return list;
    }
}
