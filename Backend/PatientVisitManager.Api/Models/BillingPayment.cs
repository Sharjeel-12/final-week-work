namespace PatientVisitManager.Api.Models;

public class BillingPayment
{
    public int PaymentID { get; set; }
    public int BillingID { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "cash"; // 'cash' | 'card'
    public string? Reference { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; } // optional join to Users for UI
}
