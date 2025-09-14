public class CreateVisitDto
{
    public int VisitID { get; set; }
    public string VisitType { get; set; }
    public int VisitTypeID { get; set; }
    public int VisitDuration { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan VisitTime { get; set; }
    public int PatientID { get; set; }
    public int DoctorID { get; set; }

    // NEW
    public string? Status { get; set; } // optional in payload; defaults to "pending"
}

public class UpdateVisitDto
{
    public int VisitID { get; set; }
    public string VisitType { get; set; }
    public int VisitTypeID { get; set; }
    public int VisitDuration { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan VisitTime { get; set; }
    public int PatientID { get; set; }
    public int DoctorID { get; set; }

    // NEW
    public string? Status { get; set; } // optional; validated same as create
}
