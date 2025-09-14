namespace PatientVisitManager.Api.Models;
public class Doctor
{
    public int DoctorID { get; set; }
    public int? VisitID { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorEmail { get; set; } = string.Empty;
    public string DoctorPhone { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
}
