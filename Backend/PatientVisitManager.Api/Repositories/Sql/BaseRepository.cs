using Microsoft.Data.SqlClient;
namespace PatientVisitManager.Api.Repositories.Sql;
public abstract class BaseRepository
{
    protected readonly string _conn;
    public BaseRepository(IConfiguration cfg) { _conn = cfg.GetConnectionString("DefaultConnection")!; }
    protected SqlConnection CreateConn() => new SqlConnection(_conn);
}
