namespace PatientVisitManager.Api.DTOs;

public class CreateVisitNoteItemDto
{
    public int? NotesID { get; set; }   // <-- accept from body OR query
    public int RuleID { get; set; }
    public int Quantity { get; set; }
}

public class UpdateVisitNoteItemDto
{
    public int ItemID { get; set; }
    public int Quantity { get; set; }
}
