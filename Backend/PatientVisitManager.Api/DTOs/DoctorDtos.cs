namespace PatientVisitManager.Api.DTOs;
public record CreateDoctorDto(string DoctorName, string DoctorEmail, string DoctorPhone, string Specialization, int doctorID);
public record UpdateDoctorDto(int DoctorID, string DoctorName, string DoctorEmail, string DoctorPhone, string Specialization, int? VisitID);
