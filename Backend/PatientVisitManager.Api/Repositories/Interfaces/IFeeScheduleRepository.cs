using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IFeeScheduleRepository
{
    Task<IEnumerable<FeeSchedule>> GetAllAsync();
}
