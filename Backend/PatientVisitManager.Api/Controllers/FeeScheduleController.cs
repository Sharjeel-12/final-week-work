using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.Repositories.Interfaces;
using PatientVisitManager.Api.Models;

namespace PatientVisitManager.Api.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeeScheduleController : ControllerBase
{
    private readonly IFeeScheduleRepository _repo;
    public FeeScheduleController(IFeeScheduleRepository repo) { _repo = repo; }
    [HttpGet] public async Task<IEnumerable<FeeSchedule>> GetAll() => await _repo.GetAllAsync();
}
