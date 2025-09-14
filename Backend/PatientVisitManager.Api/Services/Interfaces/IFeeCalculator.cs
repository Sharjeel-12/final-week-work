namespace PatientVisitManager.Api.Services.Interfaces;
public interface IFeeCalculator
{
    decimal Calculate(string visitType, int durationMinutes, decimal feePerMinute);
}
