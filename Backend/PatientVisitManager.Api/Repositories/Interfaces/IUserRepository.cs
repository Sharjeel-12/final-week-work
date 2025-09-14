using PatientVisitManager.Api.Models;
namespace PatientVisitManager.Api.Repositories.Interfaces;
public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<int> CreateAsync(User user);
    Task UpdatePasswordAsync(int id, string newHash, string newSalt);
}
