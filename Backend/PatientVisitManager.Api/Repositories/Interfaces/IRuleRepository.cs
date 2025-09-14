using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces
{
    public interface IRuleRepository
    {
        Task<int> CreateAsync(Rule r);
        Task UpdateAsync(Rule r);
        Task DeleteAsync(int id);
        Task<Rule?> GetByIdAsync(int id);
        Task<IEnumerable<Rule>> GetAllAsync();
    }
}
