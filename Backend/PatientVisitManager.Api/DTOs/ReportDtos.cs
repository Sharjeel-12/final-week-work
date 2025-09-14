namespace PatientVisitManager.Api.DTOs;

public sealed class OutstandingRowDto
{
    public int PatientID { get; set; }
    public string PatientName { get; set; } = "";
    public int Notes { get; set; }
    public decimal Billed { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    public DateTime? LastVisit { get; set; }
}

public sealed class CollectionsResponseDto
{
    public DateTime Date { get; set; }
    public decimal Total { get; set; }
    // e.g. { "cash": 1200, "card": 450 }
    public Dictionary<string, decimal> ByMethod { get; set; } = new();
    public List<BillingPaymentDto> Payments { get; set; } = new();
}

public sealed class BillingPaymentDto
{
    public int PaymentID { get; set; }
    public int BillingID { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "";
    public string? Reference { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }    // Email
    public DateTime CreatedAt { get; set; }
}
