using PatientVisitManager.Api.Models;

namespace PatientVisitManager.Api.Repositories.Interfaces;

public interface IVisitNoteItemRepository
{
    Task<IEnumerable<VisitNoteItem>> GetByNotesAsync(int notesId);
    Task<VisitNoteItem?> GetByIdAsync(int itemId);
    Task<int> CreateAsync(VisitNoteItem item);      // snapshots price from rule
    Task UpdateQuantityAsync(int itemId, int quantity);
    Task DeleteAsync(int itemId);
    Task<int?> GetNotesIdForItemAsync(int itemId);

}
