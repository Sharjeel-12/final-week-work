namespace PatientVisitManager.Api.DTOs
{
    public class CreateBillingDto
    {
        public int NotesID { get; set; }
        public decimal? OverrideTotal { get; set; } // optional override; if null, server computes from RulePrice
    }
}
