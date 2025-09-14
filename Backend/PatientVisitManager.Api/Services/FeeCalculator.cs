using PatientVisitManager.Api.Services.Interfaces;
namespace PatientVisitManager.Api.Services;
public class FeeCalculator : IFeeCalculator
{
    public decimal Calculate(string visitType, int durationMinutes, decimal feePerMinute)
        => Math.Round(feePerMinute * durationMinutes, 2, MidpointRounding.AwayFromZero);
}
