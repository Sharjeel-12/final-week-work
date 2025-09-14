using PatientVisitManager.Api.Models;

namespace PatientVisitManager.Api.Repositories.Interfaces;

public interface IVisitNoteRepository
{
    Task<int> CreateAsync(VisitNote n);
    Task UpdateAsync(VisitNote n);
    Task DeleteAsync(int notesId); // only if not finalized
    Task<VisitNote?> GetByIdAsync(int notesId);
    Task<VisitNote?> GetByVisitIdAsync(int visitId);
    Task<IEnumerable<VisitNote>> GetAllAsync();

    // Helpers for business rules
    Task<bool> IsVisitScheduledAsync(int visitId);
    Task<bool> IsFinalizedAsync(int notesId);
}
