namespace PatientVisitManager.Api.DTOs;

public class BillingLineDto
{
    public string Kind { get; set; } = default!;    // "visit" | "rule"
    public string Description { get; set; } = default!;
    public int? Quantity { get; set; }              // null for visit-fee line
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class BillingPreviewDto
{
    public int NotesID { get; set; }
    public int VisitID { get; set; }
    public IEnumerable<BillingLineDto> Lines { get; set; } = Array.Empty<BillingLineDto>();
    public decimal Total { get; set; }
}
