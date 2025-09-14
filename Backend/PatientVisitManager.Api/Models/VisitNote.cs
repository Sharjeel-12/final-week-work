namespace PatientVisitManager.Api.Models
{
    public class VisitNote
    {
        public int NotesID { get; set; }
        public int VisitID { get; set; }
        public string VisitNotes { get; set; } = default!;
        public int RuleID { get; set; }
        public bool Finalized { get; set; }   // maps to INT(0/1)
    }
}
