using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IDoctorRepository
{
    Task<IEnumerable<Doctor>> GetAllAsync();
    Task<Doctor?> GetByIdAsync(int id);
    Task<int> CreateAsync(Doctor d);
    Task UpdateAsync(Doctor d);
    Task DeleteAsync(int id);
}
