using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireAdmin")] // adjust if Receptionist can manage
public class RulesController : ControllerBase
{
    private readonly IRuleRepository _repo;
    public RulesController(IRuleRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Rule>>> GetAll() => Ok(await _repo.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Rule>> Get(int id)
    {
        var r = await _repo.GetByIdAsync(id);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateRuleDto dto)
    {
        var id = await _repo.CreateAsync(new Rule { RuleName = dto.RuleName, RulePrice = dto.RulePrice });
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRuleDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        await _repo.UpdateAsync(new Rule { Id = dto.Id, RuleName = dto.RuleName, RulePrice = dto.RulePrice });
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return NoContent();
    }
}
