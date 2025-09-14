namespace PatientVisitManager.Api.DTOs
{
    public class RecordCashDto
    {
        public int NotesId { get; set; }
        public decimal Amount { get; set; }          // amount to record as cash
        public string? Reference { get; set; }       // optional receipt # / note
    }

    public class RecordCashResponse
    {
        public int BillingID { get; set; }
        public decimal NewPaid { get; set; }
        public decimal NewBalance { get; set; }
    }

}
