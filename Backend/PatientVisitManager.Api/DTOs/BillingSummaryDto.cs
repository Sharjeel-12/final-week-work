using PatientVisitManager.Api.Models;

namespace PatientVisitManager.Api.DTOs;

public class BillingSummaryDto
{
    public int BillingID { get; set; }
    public int NotesID { get; set; }
    public decimal Total { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    public List<BillingPayment> Payments { get; set; } = new();
}
