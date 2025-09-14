using PatientVisitManager.Api.DTOs;

namespace PatientVisitManager.Api.Repositories.Interfaces;

public interface IReportsRepository
{
    Task<IReadOnlyList<OutstandingRowDto>> GetOutstandingAsync(DateTime? asOf, decimal minBalance, string? nameLike);
    Task<CollectionsResponseDto> GetCollectionsAsync(DateTime onDate);
}
