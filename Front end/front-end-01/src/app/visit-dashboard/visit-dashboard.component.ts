import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { switchMap, finalize } from 'rxjs/operators';

import { VisitDataService } from '../Services/visits-data.service';
import { Visit, CreateVisitDto, UpdateVisitDto, VisitStatus } from '../models/visit';
import { Patient } from '../models/patient';
import { Doctor } from '../models/doctor';
import { PatientDataService } from '../Services/patient-data.service';
import { DoctorDataService } from '../Services/doctor-data.service';

import { BusinessHoursDirective } from '../directives/business-hours.directive';
import { PatientNamePipe } from '../pipes/patient-name.pipe';
import { DoctorNamePipe } from '../pipes/doctor-name.pipe';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

// ✅ AG Grid
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, FirstDataRenderedEvent } from 'ag-grid-community';

type SortableKey = 'visitID' | 'visitDate' | 'visitDuration' | 'doctorID' | 'patientID' | 'visitType';

interface ConflictCandidate {
  visit: Visit;
  score: number;
  reasons: string[];
}

@Component({
  selector: 'app-visit-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BusinessHoursDirective, PatientNamePipe, DoctorNamePipe,
    CurrencyPipe, DatePipe, DecimalPipe,
    AgGridAngular
  ],
  templateUrl: './visit-dashboard.component.html',
  styleUrls: ['./visit-dashboard.component.scss']
})
export class VisitDashboardComponent implements OnInit {
  constructor(
    private visitService: VisitDataService,
    private patient_data: PatientDataService,
    private doctor_data: DoctorDataService
  ) {}

  @ViewChild(AgGridAngular) grid!: AgGridAngular;

  // ── Pagination UI ──────────────────────────────
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50, 100];

  changePageSize(size: number | string) {
    this.pageSize = Number(size) || 10;
    if (this.grid?.api) this.grid.api.paginationSetPageSize(this.pageSize);
  }

  onGridReady(e: GridReadyEvent) {
    e.api.paginationSetPageSize(this.pageSize);
  }

  onFirstDataRendered(e: FirstDataRenderedEvent) {
    e.api.sizeColumnsToFit();
  }

  quickFilter = '';

  // formatters
  private nf = new Intl.NumberFormat();
  private cf = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // ========= AG Grid Columns (includes Status + Toggle) =========
  columnDefs: ColDef[] = [
    { headerName: 'Visit ID', field: 'visitID', filter: 'agNumberColumnFilter', sortable: true, width: 110 },
    {
      headerName: 'Patient',
      colId: 'patientName',
      valueGetter: p => this.patientNameFromId(p.data?.patientID),
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 160,
      comparator: (a: string, b: string) => (a || '').localeCompare(b || '')
    },
    {
      headerName: 'Doctor',
      colId: 'doctorName',
      valueGetter: p => this.doctorNameFromId(p.data?.doctorID),
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 160,
      comparator: (a: string, b: string) => (a || '').localeCompare(b || '')
    },
    { headerName: 'Visit Type', field: 'visitType', filter: 'agTextColumnFilter', sortable: true, minWidth: 140 },
    {
      headerName: 'Duration',
      field: 'visitDuration',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      valueFormatter: p => (p.value == null ? '' : `${this.nf.format(p.value)} min`)
    },
    {
      headerName: 'Date',
      field: 'visitDate',
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 180,
      valueFormatter: p => this.displayDate(p.value),
      comparator: (a: any, b: any) => +parseServerDate(a || '') - +parseServerDate(b || '')
    },
    {
      headerName: 'Fee',
      field: 'visitFee',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      valueFormatter: p => (p.value == null ? '' : this.cf.format(p.value))
    },
    {
      headerName: 'Status',
      field: 'status',
      filter: 'agSetColumnFilter',
      sortable: true,
      width: 130,
      valueFormatter: p => (p.value ? (String(p.value).toLowerCase() === 'scheduled' ? 'Scheduled' : 'Pending') : 'Pending'),
      cellRenderer: (p: any) => {
        const val = (p.value ?? 'pending').toString().toLowerCase();
        const label = val === 'scheduled' ? 'Scheduled' : 'Pending';
        const color = val === 'scheduled' ? '#0b8043' : '#b06c00';
        return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color}20;color:${color};font-weight:600;">${label}</span>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      minWidth: 260,
      cellRenderer: (p: any) => {
        const status = (p.data?.status ?? 'pending').toLowerCase();
        const next = status === 'scheduled' ? 'pending' : 'scheduled';
        return `
          <div style="display:flex; gap:8px;">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
            <button type="button" data-action="toggle" data-next="${next}">
              ${status === 'scheduled' ? 'Mark Pending' : 'Mark Scheduled'}
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event?.target as HTMLElement;
        const action = target?.getAttribute('data-action');
        const row: Visit = params.data;
        if (action === 'edit') this.activateEditForm(row);
        if (action === 'delete') this.deleteAction(row.visitID ?? null);
        if (action === 'toggle') {
          const next = (target.getAttribute('data-next') as VisitStatus) || 'pending';
          this.toggleVisitStatus(row, next);
        }
      }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressHeaderMenuButton: true,
    floatingFilter: true
  };

  // ===== Data =====
  AllVisits: Visit[] = [];
  AllPatients: Patient[] = [];
  AllDoctors: Doctor[] = [];

  // UI state
  AddBtnPressed = false;
  EditBtnPressed = false;
  private editingId: number | null = null;
  math = Math;

  // Config
  readonly durationOptions = [15, 30, 60];
  readonly businessHours = { startHour: 9, endHour: 21 };

  private readonly visitTypeMap: Record<string, number> = {
    'Consultation': 1,
    'Follow-Up': 2,
    'Emergency': 3
  };

  // Forms
  addVisitForm!: FormGroup;
  editVisitForm!: FormGroup;
  get AddForm()  { return this.addVisitForm.controls; }
  get EditForm() { return this.editVisitForm.controls; }

  // Conflict panel
  showConflictPanel = false;
  conflictCandidates: ConflictCandidate[] = [];
  hardConflict = false;
  private pendingAdd?: { dto: CreateVisitDto; visit: Visit };
  private pendingEdit?: { id: number; dto: UpdateVisitDto; visit: Visit };

  /* ================= lifecycle ================= */
  ngOnInit(): void {
    this.patient_data.getAllPatients().subscribe({
      next: (res) => { this.AllPatients = res ?? []; this.refreshNameColumns(); },
      error: () => alert('Error loading patient data')
    });

    this.doctor_data.getAllDoctors().subscribe({
      next: (res) => { this.AllDoctors = res ?? []; this.refreshNameColumns(); },
      error: () => alert('Error loading doctor data')
    });

    this.addVisitForm = new FormGroup({
      visitID:       new FormControl<number | null>(null, [Validators.required]),
      visitType:     new FormControl<string>('', [Validators.required]),
      visitDuration: new FormControl<number | null>(null, [Validators.required, allowedDurations(this.durationOptions)]),
      visitDate:     new FormControl<string | null>(null, [Validators.required]),
      visitFee:      new FormControl<number | null>(null),
      patientID:     new FormControl<number | null>(null, [Validators.required]),
      doctorID:      new FormControl<number | null>(null, [Validators.required]),
      status:        new FormControl<VisitStatus>('pending') // NEW
    });

    this.editVisitForm = new FormGroup({
      visitID:       new FormControl<number | null>(null, [Validators.required]),
      visitType:     new FormControl<string>('', [Validators.required]),
      visitDuration: new FormControl<number | null>(null, [Validators.required, allowedDurations(this.durationOptions)]),
      visitDate:     new FormControl<string | null>(null, [Validators.required]),
      visitFee:      new FormControl<number | null>(null),
      patientID:     new FormControl<number | null>(null, [Validators.required]),
      doctorID:      new FormControl<number | null>(null, [Validators.required]),
      status:        new FormControl<VisitStatus>('pending') // NEW
    });

    this.reloadVisitsAndResetId();
  }

  /* ================= helpers for grid ================= */
  private patientNameFromId(id?: number | null): string {
    return this.AllPatients.find(p => p.patientID === id)?.patientName ?? '';
  }
  private doctorNameFromId(id?: number | null): string {
    return this.AllDoctors.find(d => d.doctorID === id)?.doctorName ?? '';
  }
  private refreshNameColumns() {
    if (this.grid?.api) {
      this.grid.api.refreshCells({ force: true, columns: ['patientName', 'doctorName'] });
    }
  }

  /* ================= UI actions ================= */
  activateForm(): void { this.AddBtnPressed = true; }
  deactivateForm(): void { this.AddBtnPressed = false; this.resetAddFormToNextId(); }

  activateEditForm(row: Visit): void {
    this.editingId = Number(row.visitID);
    this.EditBtnPressed = true; this.AddBtnPressed = false;

    this.editVisitForm.patchValue({
      visitID:       row.visitID ?? null,
      visitType:     row.visitType ?? '',
      visitDuration: row.visitDuration ?? null,
      visitDate:     toLocalInputValue(row.visitDate),
      visitFee:      row.visitFee ?? null,
      patientID:     row.patientID ?? null,
      doctorID:      row.doctorID ?? null,
      status:        (row.status ?? 'pending') as VisitStatus
    });
  }

  deactivateEditForm(): void {
    this.EditBtnPressed = false;
    this.editVisitForm.reset();
    this.editingId = null;
  }

  /* ================= CRUD ================= */
  onSubmit(): void {
    const v = this.addVisitForm.getRawValue();

    if (!withinBusinessHours(v.visitDate, Number(v.visitDuration), this.businessHours)) {
      alert(`Visit must be within business hours (${this.businessHours.startHour}:00–${this.businessHours.endHour}:00).`);
      return;
    }

    const candidateVisit: Visit = {
      visitID:       v.visitID ?? 0,
      visitType:     v.visitType ?? '',
      visitTypeID:   this.visitTypeMap[v.visitType ?? 'Consultation'],
      visitDuration: Number(v.visitDuration ?? 0),
      visitDate:     toIsoString(v.visitDate),
      visitFee:      Number(v.visitFee ?? 0),
      patientID:     Number(v.patientID),
      doctorID:      Number(v.doctorID),
      status:        (v.status ?? 'pending') as VisitStatus
    };

    const { candidates, hard } = this.detectVisitConflicts(candidateVisit, this.AllVisits);
    if (candidates.length > 0) {
      this.conflictCandidates = candidates;
      this.hardConflict = hard;
      this.showConflictPanel = true;

      const dto: CreateVisitDto = {
        visitID: candidateVisit.visitID,
        visitType: candidateVisit.visitType!,
        visitTypeID: candidateVisit.visitTypeID!,
        visitDuration: candidateVisit.visitDuration!,
        visitDate: candidateVisit.visitDate!,
        visitFee: candidateVisit.visitFee!,
        patientID: candidateVisit.patientID!,
        doctorID: candidateVisit.doctorID!,
        status: candidateVisit.status
      };

      this.pendingAdd = { dto, visit: candidateVisit };
      return;
    }

    const dto: CreateVisitDto = {
      visitID: v.visitID ?? undefined,
      visitType: v.visitType ?? '',
      visitTypeID: this.visitTypeMap[v.visitType ?? 'Consultation'],
      visitDuration: Number(v.visitDuration ?? 0),
      visitDate: toIsoString(v.visitDate),
      visitFee: Number(v.visitFee ?? 0),
      patientID: Number(v.patientID),
      doctorID: Number(v.doctorID),
      status: (v.status ?? 'pending') as VisitStatus
    };

    this.visitService.addVisit(dto).pipe(
      switchMap(() => this.visitService.getAllVisits()),
      finalize(() => (this.AddBtnPressed = false))
    ).subscribe({
      next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); this.resetAddFormToNextId(); },
      error: (err) => { if (err?.status === 409 && err?.error?.message) alert(err.error.message); else alert(err); }
    });
  }

  onEdit(): void {
    if (this.editingId == null) return;
    const v = this.editVisitForm.getRawValue();

    if (!withinBusinessHours(v.visitDate, Number(v.visitDuration), this.businessHours)) {
      alert(`Visit must be within business hours (${this.businessHours.startHour}:00–${this.businessHours.endHour}:00).`);
      return;
    }

    const updatedVisit: Visit = {
      visitID:       Number(v.visitID),
      visitType:     v.visitType ?? '',
      visitTypeID:   this.visitTypeMap[v.visitType ?? 'Consultation'],
      visitDuration: Number(v.visitDuration ?? 0),
      visitDate:     toIsoString(v.visitDate),
      visitFee:      Number(v.visitFee ?? 0),
      patientID:     Number(v.patientID),
      doctorID:      Number(v.doctorID),
      status:        (v.status ?? 'pending') as VisitStatus
    };

    const others = this.AllVisits.filter(x => x.visitID !== updatedVisit.visitID);
    const { candidates, hard } = this.detectVisitConflicts(updatedVisit, others);

    if (candidates.length > 0) {
      this.conflictCandidates = candidates;
      this.hardConflict = hard;
      this.showConflictPanel = true;

      const dto: UpdateVisitDto = {
        visitID: updatedVisit.visitID!,
        visitType: updatedVisit.visitType!,
        visitTypeID: updatedVisit.visitTypeID!,
        visitDuration: updatedVisit.visitDuration!,
        visitDate: updatedVisit.visitDate!,
        visitFee: updatedVisit.visitFee!,
        patientID: updatedVisit.patientID!,
        doctorID: updatedVisit.doctorID!,
        status: updatedVisit.status
      };

      this.pendingEdit = { id: updatedVisit.visitID!, dto, visit: updatedVisit };
      return;
    }

    this.performEdit(this.editingId, {
      visitID: updatedVisit.visitID!,
      visitType: updatedVisit.visitType!,
      visitTypeID: updatedVisit.visitTypeID!,
      visitDuration: updatedVisit.visitDuration!,
      visitDate: updatedVisit.visitDate!,
      visitFee: updatedVisit.visitFee!,
      patientID: updatedVisit.patientID!,
      doctorID: updatedVisit.doctorID!,
      status: updatedVisit.status
    }, updatedVisit);
  }

  private performEdit(id: number, dto: UpdateVisitDto, updatedVisit: Visit) {
    this.visitService.updateVisit(id, dto).pipe(
      switchMap(() => this.visitService.getAllVisits()),
      finalize(() => this.deactivateEditForm())
    ).subscribe({
      next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); },
      error: (err) => { if (err?.status === 409 && err?.error?.message) alert(err.error.message); else alert(err); }
    });
  }

  deleteAction(id: number | null): void {
    if (id == null) return;
    this.visitService.deleteVisit(id).pipe(
      switchMap(() => this.visitService.getAllVisits())
    ).subscribe({
      next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); alert('Deleted visit successfully'); },
      error: (err) => alert(err)
    });
  }

  // ======== Toggle Status via PUT ========
  toggleVisitStatus(row: Visit, next: VisitStatus) {
    const id = Number(row.visitID);
    if (!id) return;

    const dto: UpdateVisitDto = {
      visitID: id,
      visitType: row.visitType ?? 'Consultation',
      visitTypeID: row.visitTypeID ?? this.visitTypeMap[row.visitType ?? 'Consultation'],
      visitDuration: Number(row.visitDuration ?? 0),
      visitDate: row.visitDate,
      visitFee: Number(row.visitFee ?? 0),
      patientID: Number(row.patientID),
      doctorID: Number(row.doctorID),
      status: next
    };

    this.visitService.updateVisit(id, dto).pipe(
      switchMap(() => this.visitService.getAllVisits())
    ).subscribe({
      next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); },
      error: (err) => alert(err)
    });
  }

  /* ============ Conflict panel actions ============ */
  proceedAnyway() {
    if (this.hardConflict) return;
    if (this.pendingAdd) {
      const { dto } = this.pendingAdd;
      this.resetConflictPanel();
      this.visitService.addVisit(dto).pipe(
        switchMap(() => this.visitService.getAllVisits())
      ).subscribe({
        next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); this.AddBtnPressed = false; this.resetAddFormToNextId(); },
        error: (err) => alert(err)
      });
      return;
    }
    if (this.pendingEdit) {
      const { id, dto, visit } = this.pendingEdit;
      this.resetConflictPanel();
      this.performEdit(id, dto, visit);
    }
  }
  cancelConflictPanel() { this.resetConflictPanel(); }
  private resetConflictPanel() {
    this.showConflictPanel = false;
    this.conflictCandidates = [];
    this.hardConflict = false;
    this.pendingAdd = undefined;
    this.pendingEdit = undefined;
  }

  /* ================= Data + helpers ================= */
  private reloadVisitsAndResetId(): void {
    this.visitService.getAllVisits().subscribe({
      next: (res) => { this.AllVisits = normalizeStatuses(res ?? []); this.resetAddFormToNextId(); },
      error: (err) => alert(err)
    });
  }

  private computeNextId(): number {
    if (!this.AllVisits?.length) return 1;
    return this.AllVisits.reduce((max, v) => Math.max(max, Number(v.visitID) || 0), 0) + 1;
  }

  private resetAddFormToNextId(): void {
    const next = this.computeNextId();
    const idCtrl = this.addVisitForm.get('visitID');
    idCtrl?.setValue(next);
    idCtrl?.setValidators([Validators.required, Validators.min(next)]);
    idCtrl?.updateValueAndValidity({ emitEvent: false });

    this.addVisitForm.patchValue({
      visitType: '',
      visitDuration: null,
      visitDate: null,
      visitFee: null,
      patientID: null,
      doctorID: null,
      status: 'pending'
    });
    this.addVisitForm.markAsPristine();
  }

  displayDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      const d = parseServerDate(iso);
      return isNaN(+d) ? iso! : d.toLocaleString();
    } catch { return iso!; }
  }

  private detectVisitConflicts(candidate: Visit, pool: Visit[]): { candidates: ConflictCandidate[]; hard: boolean } {
    const out: ConflictCandidate[] = [];
    let hard = false;

    const { start: cStart, end: cEnd } = intervalFromServer(candidate.visitDate!, candidate.visitDuration || 0);

    for (const v of pool) {
      const reasons: string[] = [];
      let score = 0;

      const sameDoctor  = Number(v.doctorID)  === Number(candidate.doctorID);
      const samePatient = Number(v.patientID) === Number(candidate.patientID);

      const { start: vStart, end: vEnd } = intervalFromServer(v.visitDate!, v.visitDuration || 0);
      const overlap = intervalsOverlap(cStart, cEnd, vStart, vEnd);

      if (sameDoctor && overlap) { reasons.push('Same doctor overlapping time'); score += 1.0; hard = true; }
      if (samePatient && overlap) { reasons.push('Same patient overlapping time'); score += 0.75; }

      if (samePatient && isSameLocalDay(cStart, vStart)) { reasons.push('Same patient on the same day'); score += 0.35; }
      const startDiffMin = Math.abs((cStart.getTime() - vStart.getTime()) / 60000);
      if (sameDoctor && !overlap && startDiffMin <= 15) { reasons.push('Same doctor within ±15 minutes'); score += 0.35; }

      const typeEqual = (candidate.visitType ?? '').toLowerCase() === (v.visitType ?? '').toLowerCase();
      if (typeEqual && Math.abs(cStart.getTime() - vStart.getTime()) <= 120 * 60000) {
        reasons.push('Same visit type within 2 hours'); score += 0.15;
      }

      if (reasons.length && (hard || score >= 0.5)) out.push({ visit: v, score: Math.min(1, score), reasons });
    }

    out.sort((a, b) => b.score - a.score);
    return { candidates: out, hard };
  }
}

/* ================= Helpers ================= */
function allowedDurations(allowed: number[]): ValidatorFn {
  return (ctrl: AbstractControl) => {
    const val = Number(ctrl.value);
    return allowed.includes(val) ? null : { durationNotAllowed: true };
  };
}

function parseServerDate(value: string): Date {
  if (!value) return new Date(NaN);
  const hasZone = /Z|[+-]\d{2}:\d{2}$/.test(value);
  const normalized = hasZone ? value : value + 'Z';
  return new Date(normalized);
}

function toIsoString(localValue: string | null): string {
  if (!localValue) return new Date().toISOString();
  return new Date(localValue).toISOString();
}

function toLocalInputValue(iso: string | null): string | null {
  if (!iso) return null;
  const d = parseServerDate(iso);
  if (isNaN(+d)) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function intervalFromServer(iso: string, durationMin: number): { start: Date; end: Date } {
  const start = parseServerDate(iso);
  const end   = new Date(start.getTime() + Math.max(0, durationMin) * 60_000);
  return { start, end };
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

function withinBusinessHours(localDateStr: string | null, durationMin: number, hours: { startHour: number; endHour: number }): boolean {
  if (!localDateStr) return false;
  const start = new Date(localDateStr);
  const end = new Date(start.getTime() + Math.max(0, durationMin) * 60_000);
  const sH = hours.startHour, eH = hours.endHour;
  return start.getHours() >= sH &&
         (end.getHours() < eH || (end.getHours() === eH && end.getMinutes() === 0));
}

// Normalize possible missing/incorrect statuses from API
function normalizeStatuses(list: Visit[]): Visit[] {
  for (const v of list) {
    const s = (v as any).status;
    v.status = (s === 'scheduled' || s === 'pending') ? s : 'pending';
    // If server omitted visitTypeID, try to infer common mapping:
    if (v.visitTypeID == null && v.visitType) {
      const map: Record<string, number> = { 'Consultation': 1, 'Follow-Up': 2, 'Emergency': 3 };
      v.visitTypeID = map[v.visitType] ?? null;
    }
  }
  return list;
}
