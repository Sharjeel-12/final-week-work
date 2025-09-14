using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;

public sealed class ReportsRepository : BaseRepository, IReportsRepository
{
    public ReportsRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<IReadOnlyList<OutstandingRowDto>> GetOutstandingAsync(DateTime? asOf, decimal minBalance, string? nameLike)
    {
        // We aggregate payments in a subquery and join ONCE to avoid multiplying totals.
        var list = new List<OutstandingRowDto>();
        using var conn = CreateConn(); await conn.OpenAsync();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
DECLARE @AsOf DATETIME = @pAsOf;
-- Billings: use VisitDate to decide 'as of'
WITH B AS (
  SELECT b.billingID, v.patientID, p.patientName, v.visitDate, b.totalBill
  FROM dbo.billing b
  JOIN dbo.visitNotes vn ON vn.notesID = b.notesID
  JOIN dbo.visits v     ON v.visitID   = vn.visitID
  JOIN dbo.patients p   ON p.patientID = v.patientID
  WHERE @AsOf IS NULL OR v.visitDate <= @AsOf
),
PAID AS (
  SELECT bp.billingID, SUM(bp.amount) AS paid
  FROM dbo.billingPayments bp
  WHERE @AsOf IS NULL OR bp.createdAt <= @AsOf
  GROUP BY bp.billingID
)
SELECT
  B.patientID,
  MIN(B.patientName)        AS patientName,
  COUNT(*)                  AS notes,
  SUM(B.totalBill)          AS billed,
  SUM(ISNULL(PAID.paid,0))  AS paid,
  SUM(B.totalBill - ISNULL(PAID.paid,0)) AS balance,
  MAX(B.visitDate)          AS lastVisit
FROM B
LEFT JOIN PAID ON PAID.billingID = B.billingID
GROUP BY B.patientID
HAVING SUM(B.totalBill - ISNULL(PAID.paid,0)) >= @pMin
   AND (@pName IS NULL OR MIN(B.patientName) LIKE '%' + @pName + '%')
ORDER BY balance DESC, patientName;";
        cmd.Parameters.AddWithValue("@pAsOf", (object?)asOf ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pMin", minBalance);
        cmd.Parameters.AddWithValue("@pName", (object?)nameLike ?? DBNull.Value);

        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            list.Add(new OutstandingRowDto
            {
                PatientID = r.GetInt32(0),
                PatientName = r.GetString(1),
                Notes = r.GetInt32(2),
                Billed = r.GetDecimal(3),
                Paid = r.GetDecimal(4),
                Balance = r.GetDecimal(5),
                LastVisit = r.IsDBNull(6) ? (DateTime?)null : r.GetDateTime(6)
            });
        }
        return list;
    }

    public async Task<CollectionsResponseDto> GetCollectionsAsync(DateTime onDate)
    {
        var dto = new CollectionsResponseDto { Date = onDate.Date };

        using var conn = CreateConn(); await conn.OpenAsync();

        // 1) By method
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
SELECT method, SUM(amount) AS total
FROM dbo.billingPayments
WHERE CAST(createdAt AS DATE) = CAST(@d AS DATE)
GROUP BY method";
            cmd.Parameters.AddWithValue("@d", onDate.Date);

            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                var method = r.GetString(0);
                var total = r.GetDecimal(1);
                dto.ByMethod[method] = total;
                dto.Total += total;
            }
        }

        // 2) Payment list (join to Users.Email for display)
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
SELECT p.paymentID, p.billingID, p.amount, p.method, p.reference, p.createdBy, p.createdAt,
       u.Email
FROM dbo.billingPayments p
LEFT JOIN dbo.Users u ON u.Id = p.createdBy
WHERE CAST(p.createdAt AS DATE) = CAST(@d AS DATE)
ORDER BY p.createdAt DESC, p.paymentID DESC";
            cmd.Parameters.AddWithValue("@d", onDate.Date);

            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                dto.Payments.Add(new BillingPaymentDto
                {
                    PaymentID = r.GetInt32(0),
                    BillingID = r.GetInt32(1),
                    Amount = r.GetDecimal(2),
                    Method = r.GetString(3),
                    Reference = r.IsDBNull(4) ? null : r.GetString(4),
                    CreatedBy = r.IsDBNull(5) ? (int?)null : r.GetInt32(5),
                    CreatedAt = r.GetDateTime(6),
                    CreatedByName = r.IsDBNull(7) ? null : r.GetString(7)
                });
            }
        }

        return dto;
    }
}
