using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientVisitManager.Api.DTOs;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VisitNoteItemsController : ControllerBase
    {
        private readonly IVisitNoteRepository _notes;
        private readonly IVisitNoteItemRepository _items;

        public VisitNoteItemsController(IVisitNoteRepository notes, IVisitNoteItemRepository items)
        {
            _notes = notes;
            _items = items;
        }

        private async Task<bool> IsFinalized(int notesId)
        {
            var n = await _notes.GetByIdAsync(notesId);
            return n?.Finalized == true;
        }

        // GET /api/VisitNoteItems?notesId=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VisitNoteItem>>> GetAll([FromQuery] int notesId)
        {
            if (notesId <= 0) return BadRequest("notesId is required.");
            return Ok(await _items.GetByNotesAsync(notesId));
        }

        // POST /api/VisitNoteItems  body: { notesID, ruleID, quantity }
        // also supports /api/VisitNoteItems?notesId=5 with body { ruleID, quantity }
        [HttpPost]
        [Authorize(Policy = "RequireReceptionistOrAdmin")]
        public async Task<ActionResult> AddItem([FromQuery] int? notesId, [FromBody] CreateVisitNoteItemDto dto)
        {
            var nid = notesId ?? dto.NotesID;
            if (nid is null or <= 0) return BadRequest("notesId/notesID is required.");
            if (dto == null) return BadRequest("Body is required.");
            if (dto.Quantity <= 0) return BadRequest("Quantity must be >= 1.");
            if (await IsFinalized(nid.Value)) return BadRequest("Note is finalized.");

            var itemId = await _items.CreateAsync(new VisitNoteItem
            {
                NotesID = nid.Value,
                RuleID = dto.RuleID,
                Quantity = dto.Quantity
            });

            return CreatedAtAction(nameof(GetAll), new { notesId = nid.Value }, new { id = itemId });
        }

        // PUT /api/VisitNoteItems/{itemId}  body: { itemID, quantity }
        // (Derives notesId from item to enforce finalized check)
        [HttpPut("{itemId:int}")]
        [Authorize(Policy = "RequireReceptionistOrAdmin")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpdateVisitNoteItemDto dto)
        {
            if (itemId != dto.ItemID) return BadRequest("ID mismatch.");
            if (dto.Quantity <= 0) return BadRequest("Quantity must be >= 1.");

            var notesId = await _items.GetNotesIdForItemAsync(itemId);
            if (notesId is null) return NotFound("Item not found.");
            if (await IsFinalized(notesId.Value)) return BadRequest("Note is finalized.");

            await _items.UpdateQuantityAsync(itemId, dto.Quantity);
            return NoContent();
        }

        // DELETE /api/VisitNoteItems/{itemId}
        [HttpDelete("{itemId:int}")]
        [Authorize(Policy = "RequireReceptionistOrAdmin")]
        public async Task<IActionResult> DeleteItem(int itemId)
        {
            var notesId = await _items.GetNotesIdForItemAsync(itemId);
            if (notesId is null) return NotFound("Item not found.");
            if (await IsFinalized(notesId.Value)) return BadRequest("Note is finalized.");

            await _items.DeleteAsync(itemId);
            return NoContent();
        }
    }
}
