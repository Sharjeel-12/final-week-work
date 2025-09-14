namespace PatientVisitManager.Api.DTOs
{
    public class CreateIntentDto
    {
        public int NotesId { get; set; }
        public decimal? Amount { get; set; } // optional partial amount
    }

    public class CreateIntentResponse
    {
        public string ClientSecret { get; set; } = default!;
    }
}
