using PatientVisitManager.Api.Models;

namespace PatientVisitManager.Api.Repositories.Interfaces;

public interface IBillingRepository
{
    Task<int> CreateForNoteAsync(int notesId, decimal totalBill); // should set finalized=1 in txn
    Task<Billing?> GetByIdAsync(int billingId);
    Task<Billing?> GetByNotesIdAsync(int notesId);
}
