namespace PatientVisitManager.Api.Models;
public class FeeSchedule
{
    public int FeeID { get; set; }
    public string VisitType { get; set; } = "";
    public decimal FeePerMinute { get; set; }
}
