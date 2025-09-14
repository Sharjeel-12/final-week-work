namespace PatientVisitManager.Api.Models;

public class VisitNoteItem
{
    public int ItemID { get; set; }
    public int NotesID { get; set; }
    public int RuleID { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }  // snapshot
}
