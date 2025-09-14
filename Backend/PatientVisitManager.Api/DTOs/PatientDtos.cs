namespace PatientVisitManager.Api.DTOs;
public record CreatePatientDto(string patientName, string patientEmail, string patientPhone, string patientDescription, int patientID);
public record UpdatePatientDto(int patientID, string patientName, string patientEmail, string patientPhone, string patientDescription, int? visitID);
