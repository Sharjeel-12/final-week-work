using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IPatientRepository
{
    Task<IEnumerable<Patient>> GetAllAsync();
    Task<Patient?> GetByIdAsync(int id);
    Task<int> CreateAsync(Patient p);
    Task UpdateAsync(Patient p);
    Task DeleteAsync(int id);
}
