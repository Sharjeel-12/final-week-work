using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IVisitRepository
{
    Task<IEnumerable<Visit>> GetAllAsync();
    Task<Visit?> GetByIdAsync(int id);
    Task<int> CreateAsync(Visit v);
    Task UpdateAsync(Visit v);
    Task DeleteAsync(int id);
    Task<decimal> GetFeePerMinuteByVisitTypeAsync(string visitType);
}
