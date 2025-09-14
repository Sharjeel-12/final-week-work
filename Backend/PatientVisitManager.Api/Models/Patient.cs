namespace PatientVisitManager.Api.Models;
public class Patient
{
    public int PatientID { get; set; }
    public int? VisitID { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientEmail { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string PatientDescription { get; set; } = string.Empty;
}
