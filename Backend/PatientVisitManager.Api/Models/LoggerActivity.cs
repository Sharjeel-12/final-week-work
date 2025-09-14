namespace PatientVisitManager.Api.Models;

public class LoggerActivity
{
    public int ActivityID { get; set; }
    public string ActivityDescription { get; set; } = string.Empty;
    public int? LoggerID { get; set; }
    public DateTime? ActivityDate { get; set; }
    public TimeSpan? ActivityTime { get; set; }
}
