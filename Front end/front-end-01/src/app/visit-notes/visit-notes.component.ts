import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, FirstDataRenderedEvent, RowClickedEvent } from 'ag-grid-community';

import { VisitDataService } from '../Services/visits-data.service';
import { PatientDataService } from '../Services/patient-data.service';
import { DoctorDataService } from '../Services/doctor-data.service';

import { Visit } from '../models/visit';
import { Patient } from '../models/patient';
import { Doctor } from '../models/doctor';

import {
  VisitNote, CreateVisitNoteDto, UpdateVisitNoteDto,
  VisitNoteItem, CreateVisitNoteItemDto, UpdateVisitNoteItemDto,
  Rule, BillingPreviewDto
} from '../models/visit-note';

import {
  VisitNotesDataService, VisitNoteItemsDataService, RulesDataService, BillingDataService
} from '../Services/visit-notes-data.service';
import { PatientNamePipe } from '../pipes/patient-name.pipe';
import { DoctorNamePipe } from '../pipes/doctor-name.pipe';

@Component({
  selector: 'app-visit-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, PatientNamePipe, DoctorNamePipe],
  templateUrl: './visit-notes.component.html',
  styleUrls: ['./visit-notes.component.scss']
})
export class VisitNotesComponent implements OnInit {
  constructor(
    private visitsSvc: VisitDataService,
    private patientsSvc: PatientDataService,
    private doctorsSvc: DoctorDataService,
    private notesSvc: VisitNotesDataService,
    private itemsSvc: VisitNoteItemsDataService,
    private rulesSvc: RulesDataService,
    private billingSvc: BillingDataService
  ) {}

  @ViewChild(AgGridAngular) grid!: AgGridAngular;

  // master datasets
  AllVisits: Visit[] = [];
  AllPatients: Patient[] = [];
  AllDoctors: Doctor[] = [];
  AllRules: Rule[] = [];
  AllNotes: VisitNote[] = [];

  // AG Grid config (notes list)
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50, 100];

  columnDefs: ColDef[] = [
    { headerName: 'Note ID', field: 'notesID', width: 110, sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Visit ID', field: 'visitID', width: 110, sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Patient', valueGetter: p => this.patientName(p.data?.visitID), sortable: true, filter: 'agTextColumnFilter', minWidth: 160 },
    { headerName: 'Doctor', valueGetter: p => this.doctorName(p.data?.visitID), sortable: true, filter: 'agTextColumnFilter', minWidth: 160 },
    {
      headerName: 'Finalized', field: 'finalized', width: 120, filter: 'agSetColumnFilter',
      valueFormatter: p => p.value ? 'Yes' : 'No',
      cellRenderer: (p: any) => {
        const ok = !!p.value; const color = ok ? '#0b8043' : '#b06c00';
        return `<span style="padding:2px 8px;border-radius:999px;background:${color}20;color:${color};font-weight:600;">${ok ? 'Yes' : 'No'}</span>`;
      }
    },
    {
      headerName: 'Actions', field: 'actions', minWidth: 320, sortable: false, filter: false,
      cellRenderer: (p: any) => {
        const f = !!p.data?.finalized;
        return `
          <div style="display:flex; gap:8px;">
            <button type="button" data-action="edit" ${f ? 'disabled' : ''}>Edit</button>
            <button type="button" data-action="delete" ${f ? 'disabled' : ''}>Delete</button>
            <button type="button" data-action="open">Items & Preview</button>
            <button type="button" data-action="finalize" ${f ? 'disabled' : ''}>Finalize</button>
          </div>`;
      },
      onCellClicked: (params: any) => {
        const action = (params.event?.target as HTMLElement)?.getAttribute('data-action');
        const row: VisitNote = params.data;
        if (action === 'edit') this.activateEditForm(row);
        if (action === 'delete') this.deleteNote(row.notesID);
        if (action === 'open') this.openItemsPanel(row);
        if (action === 'finalize') this.finalize(row.notesID);
      }
    }
  ];
  defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, floatingFilter: true, suppressHeaderMenuButton: true };

  onGridReady(e: GridReadyEvent) { e.api.paginationSetPageSize(this.pageSize); }
  onFirstDataRendered(e: FirstDataRenderedEvent) { e.api.sizeColumnsToFit(); }
  changePageSize(size: number | string) { this.pageSize = Number(size) || 10; this.grid?.api?.paginationSetPageSize(this.pageSize); }
  onRowClicked(_e: RowClickedEvent) {} // not used, actions handle it

  // forms
  addForm!: FormGroup;
  editForm!: FormGroup;
  AddBtnPressed = false;
  EditBtnPressed = false;

  // side panel (items + preview)
  sideOpen = false;
  selectedNote: VisitNote | null = null;
  noteItems: VisitNoteItem[] = [];
  addItemForm!: FormGroup;
  preview?: BillingPreviewDto;

  ngOnInit(): void {
    this.patientsSvc.getAllPatients().subscribe({ next: r => this.AllPatients = r ?? [] });
    this.doctorsSvc.getAllDoctors().subscribe({ next: r => this.AllDoctors = r ?? [] });
    this.rulesSvc.getAll().subscribe({ next: r => this.AllRules = r ?? [] });

    this.reloadNotes();

    this.addForm = new FormGroup({
      visitID: new FormControl<number | null>(null, [Validators.required]),
      visitNotes: new FormControl<string>('', [Validators.required, Validators.maxLength(2000)])
    });
    this.editForm = new FormGroup({
      notesID: new FormControl<number | null>(null, [Validators.required]),
      visitNotes: new FormControl<string>('', [Validators.required, Validators.maxLength(2000)])
    });
    this.addItemForm = new FormGroup({
      ruleID: new FormControl<number | null>(null, [Validators.required]),
      quantity: new FormControl<number>(1, [Validators.required, Validators.min(1)])
    });
  }

  /* ---------- load ---------- */
  private reloadNotes() {
    this.visitsSvc.getAllVisits().subscribe({
      next: v => {
        this.AllVisits = v ?? [];
        this.notesSvc.getAll().subscribe({
          next: n => this.AllNotes = n ?? [],
          error: err => alert(this.httpErr(err))
        });
      },
      error: err => alert(this.httpErr(err))
    });
  }

  /* ---------- helpers ---------- */
  private patientName(visitID?: number): string {
    const v = this.AllVisits.find(x => Number(x.visitID) === Number(visitID));
    const p = v ? this.AllPatients.find(pp => Number(pp.patientID) === Number(v.patientID)) : undefined;
    return p?.patientName ?? '';
  }
  private doctorName(visitID?: number): string {
    const v = this.AllVisits.find(x => Number(x.visitID) === Number(visitID));
    const d = v ? this.AllDoctors.find(dd => Number(dd.doctorID) === Number(v.doctorID)) : undefined;
    return d?.doctorName ?? '';
  }

  /* ---------- add/edit note ---------- */
  activateAdd() { this.AddBtnPressed = true; this.EditBtnPressed = false; this.addForm.reset(); }
  cancelAdd() { this.AddBtnPressed = false; this.addForm.reset(); }
createNote() {
  const v = this.addForm.getRawValue();
  const visitId = Number(v.visitID);

  // front-end validation: visit must exist
  const visit = this.findVisit(visitId);
  if (!visit) { alert('Selected visit does not exist.'); return; }

  // must be scheduled
  if (String(visit.status).toLowerCase() !== 'scheduled') {
    alert('A visit note can only be created for visits marked as "scheduled".');
    return;
  }

  // only one note per visit
  const dup = this.AllNotes.some(n => Number(n.visitID) === visitId);
  if (dup) { alert(`A note already exists for visit #${visitId}.`); return; }

  const dto: CreateVisitNoteDto = {
    visitID: visitId,
    visitNotes: String(v.visitNotes || '')
  };

  this.notesSvc.create(dto).pipe(switchMap(() => this.notesSvc.getAll())).subscribe({
    next: n => { this.AllNotes = n ?? []; this.AddBtnPressed = false; this.addForm.reset(); },
    error: err => alert(this.httpErr(err)) // you already have httpErr
  });
}


  activateEditForm(row: VisitNote) {
    if (row.finalized) { alert('Finalized note cannot be edited'); return; }
    this.EditBtnPressed = true; this.AddBtnPressed = false;
    this.editForm.patchValue({ notesID: row.notesID, visitNotes: row.visitNotes });
  }
  cancelEdit() { this.EditBtnPressed = false; this.editForm.reset(); }
  updateNote() {
    const v = this.editForm.getRawValue();
    const dto: UpdateVisitNoteDto = { notesID: Number(v.notesID), visitNotes: String(v.visitNotes || '') };
    this.notesSvc.update(dto.notesID, dto).pipe(switchMap(() => this.notesSvc.getAll())).subscribe({
      next: n => { this.AllNotes = n ?? []; this.EditBtnPressed = false; this.editForm.reset(); },
      error: err => alert(this.httpErr(err))
    });
  }
  deleteNote(notesId: number) {
    const row = this.AllNotes.find(n => n.notesID === notesId);
    if (!row) return;
    if (row.finalized) { alert('Finalized note cannot be deleted'); return; }
    if (!confirm(`Delete note #${notesId}?`)) return;
    this.notesSvc.delete(notesId).pipe(switchMap(() => this.notesSvc.getAll())).subscribe({
      next: n => this.AllNotes = n ?? [],
      error: err => alert(this.httpErr(err))
    });
  }

  /* ---------- items & preview panel ---------- */
  openItemsPanel(row: VisitNote) {
    this.selectedNote = row;
    this.sideOpen = true;
    this.loadItems(row.notesID);
    this.loadPreview(row.notesID);
  }
  closeItemsPanel() {
    this.sideOpen = false;
    this.selectedNote = null;
    this.noteItems = [];
    this.preview = undefined;
    this.addItemForm.reset({ ruleID: null, quantity: 1 });
  }

  private loadItems(notesId: number) {
    this.itemsSvc.list(notesId).subscribe({
      next: items => this.noteItems = items ?? [],
      error: err => alert(this.httpErr(err))
    });
  }
  loadPreview(notesId: number) {
    this.billingSvc.preview(notesId).subscribe({
      next: p => this.preview = p,
      error: err => alert(this.httpErr(err))
    });
  }

  addItem() {
    if (!this.selectedNote) return;
    if (this.selectedNote.finalized) { alert('Finalized note cannot be changed'); return; }
    const v = this.addItemForm.getRawValue();
    const dto: CreateVisitNoteItemDto = { ruleID: Number(v.ruleID), quantity: Number(v.quantity) || 1 };
    this.itemsSvc.add(this.selectedNote.notesID, dto).subscribe({
      next: () => { this.loadItems(this.selectedNote!.notesID); this.loadPreview(this.selectedNote!.notesID); this.addItemForm.reset({ ruleID: null, quantity: 1 }); },
      error: err => alert(this.httpErr(err))
    });
  }
  updateQty(item: VisitNoteItem, qty: number) {
    if (!this.selectedNote || this.selectedNote.finalized) return;
    const n = Math.max(1, Math.floor(Number(qty) || 1));
    const dto: UpdateVisitNoteItemDto = { itemID: item.itemID, quantity: n };
    this.itemsSvc.update(this.selectedNote.notesID, dto).subscribe({
      next: () => { this.loadItems(this.selectedNote!.notesID); this.loadPreview(this.selectedNote!.notesID); },
      error: err => alert(this.httpErr(err))
    });
  }
  removeItem(item: VisitNoteItem) {
    if (!this.selectedNote || this.selectedNote.finalized) return;
    if (!confirm('Remove item?')) return;
    this.itemsSvc.remove(this.selectedNote.notesID, item.itemID).subscribe({
      next: () => { this.loadItems(this.selectedNote!.notesID); this.loadPreview(this.selectedNote!.notesID); },
      error: err => alert(this.httpErr(err))
    });
  }

  /* ---------- finalize ---------- */
  finalize(notesId: number) {
    const row = this.AllNotes.find(n => n.notesID === notesId);
    if (!row) return;
    if (row.finalized) { alert('Already finalized'); return; }
    if (!confirm('Finalize billing? This will lock the note.')) return;

    this.billingSvc.create({ notesID: notesId }).pipe(
      switchMap(() => this.notesSvc.getAll())
    ).subscribe({
      next: n => {
        this.AllNotes = n ?? [];
        if (this.selectedNote?.notesID === notesId) {
          this.selectedNote = this.AllNotes.find(x => x.notesID === notesId) || null;
        }
        this.loadPreview(notesId);
        alert('Billing created and note finalized.');
      },
      error: err => alert(this.httpErr(err))
    });
  }

  // helper used in template for rule display
  ruleNameById(ruleId: number | null | undefined): string {
    if (!ruleId) return String(ruleId ?? '');
    const r = this.AllRules?.find(x => x.id === Number(ruleId));
    return r?.ruleName ?? String(ruleId);
  }

  //  error pretty-printer for HTTP calls
  private httpErr(e: any): string {
    if (!e) return 'Unknown error';
    // Angular HttpErrorResponse shape
    if (e.error) {
      if (typeof e.error === 'string') return e.error;               // raw text from server
      if (e.error?.message) return e.error.message;                  // { message: "..." }
      try { return JSON.stringify(e.error); } catch { /* ignore */ }
    }
    if (e.status) return `${e.status} ${e.statusText || ''}`.trim();  // "405 Method Not Allowed"
    try { return JSON.stringify(e); } catch { return String(e); }
  }

// visits that are 'scheduled' and do NOT already have a note
get availableVisitsForNote(): Visit[] {
  const withNote = new Set(this.AllNotes.map(n => n.visitID));
  return (this.AllVisits || []).filter(v =>
    String(v.status).toLowerCase() === 'scheduled' &&
    v.visitID != null &&
    !withNote.has(Number(v.visitID))
  );
}

private findVisit(id: number | null | undefined): Visit | undefined {
  if (id == null) return undefined;
  return this.AllVisits.find(v => Number(v.visitID) === Number(id));
}



}
