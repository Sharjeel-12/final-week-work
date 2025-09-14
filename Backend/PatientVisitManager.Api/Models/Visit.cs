namespace PatientVisitManager.Api.Models;

public class Visit
{
    public int VisitID { get; set; }
    public string VisitType { get; set; }
    public int? VisitTypeID { get; set; }
    public int VisitDuration { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan VisitTime { get; set; }
    public decimal VisitFee { get; set; }
    public int PatientID { get; set; }
    public int DoctorID { get; set; }

    public string Status { get; set; } = "pending"; // allowed: "pending" | "scheduled"
}
