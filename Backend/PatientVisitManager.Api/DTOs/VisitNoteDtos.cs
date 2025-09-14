namespace PatientVisitManager.Api.DTOs
{

    public class CreateVisitNoteDto
    {
        public int VisitID { get; set; }
        public string VisitNotes { get; set; } = default!;
        public int RuleID { get; set; }
    }

    public class UpdateVisitNoteDto
    {
        public int NotesID { get; set; }
        public string VisitNotes { get; set; } = default!;
        public int RuleID { get; set; }
    }

}
