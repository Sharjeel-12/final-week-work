import { Component, OnInit, ViewChild } from '@angular/core';
import { PatientDataService } from '../Services/patient-data.service';
import { Patient } from '../models/patient';
import { CreatePatientDto } from '../models/create-patient-dto';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitDataService } from '../Services/visits-data.service';
import { Visit } from '../models/visit';
import { DecimalPipe } from '@angular/common';

// ✅ AG Grid (standalone)
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ColGroupDef, GridReadyEvent, FirstDataRenderedEvent } from 'ag-grid-community';

type SortableKey = 'patientID' | 'patientName' | 'patientEmail' | 'patientPhone' | 'patientDescription';

interface DuplicateCandidate {
  patient: Patient;
  score: number;
  reasons: string[];
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, AgGridAngular],
  providers: [PatientDataService],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent implements OnInit {

  constructor(private dataService: PatientDataService, private visit_data: VisitDataService) {}

  // ===== Forms =====
  addPatientForm!: FormGroup;
  editPatientForm!: FormGroup;
  get AddForm(){ return this.addPatientForm.controls; }
  get EditForm(){ return this.editPatientForm.controls; }

  // ===== Data =====
  AllPatients: Patient[] = [];
  AllVisits!: Visit[];

  AddBtnPressed = false;
  EditBtnPressed = false;

  last_id!: number | null | undefined;

  // ===== Search -> AG Grid quick filter =====
  searchFC = new FormControl<string>('', { nonNullable: true });

  // ===== Pagination (AG Grid built-in) =====
  pageSize = 5;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // ===== AG Grid =====
  @ViewChild(AgGridAngular) grid!: AgGridAngular;

  columnDefs: (ColDef | ColGroupDef)[] = [
    { headerName: 'Patient ID',        field: 'patientID',        filter: 'agNumberColumnFilter', width: 130 },
    { headerName: 'Patient Name',      field: 'patientName',      filter: 'agTextColumnFilter' },
    { headerName: 'Patient Email',     field: 'patientEmail',     filter: 'agTextColumnFilter' },
    { headerName: 'Patient Phone',     field: 'patientPhone',     filter: 'agTextColumnFilter', width: 180 },
    { headerName: 'Patient Description', field: 'patientDescription', filter: 'agTextColumnFilter' },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 200,
      sortable: false,
      filter: false,
      cellRenderer: () => `
        <div class="actions" style="display:flex; gap:8px;">
          <button type="button" data-action="edit">Edit</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      `,
      onCellClicked: (params: any) => {
        const action = (params.event?.target as HTMLElement)?.getAttribute('data-action');
        const row: Patient = params.data;
        if (action === 'edit') this.activateEditForm(row);
        if (action === 'delete') this.deleteAction(row.patientID!);
      }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
    suppressHeaderMenuButton: true
  };

  // ---- duplicate panel state ----
  showDuplicatePanel = false;
  duplicateCandidates: DuplicateCandidate[] = [];
  hardDuplicate = false;
  private pendingAdd?: { dto: CreatePatientDto; patient: Patient };

  // ---------- UI actions ----------
  activateForm(): void { this.AddBtnPressed = true; this.EditBtnPressed=false; }
  deactivateForm(): void { this.AddBtnPressed = false; }
  deactivateEditForm(): void { this.EditBtnPressed = false; }

  // ---------- Add ----------
  onSubmit(): void {
    const dto: CreatePatientDto = {
      patientID: this.addPatientForm.value.patientID,
      patientName: this.addPatientForm.value.patientName,
      patientEmail: this.addPatientForm.value.patientEmail,
      patientPhone: this.addPatientForm.value.patientPhone,
      patientDescription: this.addPatientForm.value.patientDescription,
    };

    const patient: Patient = {
      patientID: this.addPatientForm.value.patientID,
      visitID: null,
      patientName: this.addPatientForm.value.patientName,
      patientEmail: this.addPatientForm.value.patientEmail,
      patientPhone: this.addPatientForm.value.patientPhone,
      patientDescription: this.addPatientForm.value.patientDescription,
    };

    // Pre-submit duplicate scan
    const { candidates, hard } = this.detectDuplicates(patient, this.AllPatients);
    if (candidates.length > 0) {
      this.duplicateCandidates = candidates;
      this.hardDuplicate = hard;
      this.showDuplicatePanel = true;
      this.pendingAdd = { dto, patient };
      return;
    }

    // no duplicates detected so create now
    this.performAdd(dto, patient);
  }

  private performAdd(dto: CreatePatientDto, patient: Patient) {
    this.dataService.AddNewPatient(dto).subscribe({
      next: () => {
        // new array ref to trigger change detection
        this.AllPatients = [...this.AllPatients, patient];
        // optional: update grid immediately if already ready
        this.grid?.api?.setRowData(this.AllPatients);

        alert('Patient Added Successfully');
        this.AddBtnPressed = false;

        // bump next suggested id
        this.last_id = Math.max(...this.AllPatients.map(p => p.patientID ?? 0));
        const idCtrl = this.addPatientForm.get('patientID');
        idCtrl?.setValue(Number(this.last_id) + 1);
        idCtrl?.setValidators([Validators.required, Validators.min(Number(this.last_id) + 1)]);
        idCtrl?.updateValueAndValidity();
      },
      error: (err) => { alert(err); }
    });
  }

  // Duplicate panel actions
  proceedAddAnyway() {
    if (!this.pendingAdd) return;
    if (this.hardDuplicate) return;
    const { dto, patient } = this.pendingAdd;
    this.showDuplicatePanel = false;
    this.duplicateCandidates = [];
    this.pendingAdd = undefined;
    this.performAdd(dto, patient);
  }

  cancelDuplicatePanel() {
    this.showDuplicatePanel = false;
    this.duplicateCandidates = [];
    this.hardDuplicate = false;
    this.pendingAdd = undefined;
  }

  useExisting(p: Patient) {
    this.activateEditForm(p);
    this.deactivateForm();
    this.cancelDuplicatePanel();
  }

  // ---------- Edit ----------
  activateEditForm(p: Patient): void {
    this.editPatientForm.patchValue({
      patientID: p.patientID,
      visitID: p.visitID ?? null,
      patientName: p.patientName,
      patientEmail: p.patientEmail,
      patientPhone: p.patientPhone,
      patientDescription: p.patientDescription ?? ''
    });
    this.EditBtnPressed = true;
    this.AddBtnPressed=false;
  }

  onEdit(): void {
    const patient: Patient = {
      patientID: this.editPatientForm.value.patientID,
      visitID: this.editPatientForm.value.visitID,
      patientName: this.editPatientForm.value.patientName,
      patientEmail: this.editPatientForm.value.patientEmail,
      patientPhone: this.editPatientForm.value.patientPhone,
      patientDescription: this.editPatientForm.value.patientDescription,
    };

    const others = this.AllPatients.filter(p => p.patientID !== patient.patientID);
    const { hard } = this.detectDuplicates(patient, others);
    if (hard) {
      alert('Edit would conflict with an existing record (same email or phone).');
      return;
    }

    this.dataService.UpdatePatient(patient.patientID, patient).subscribe({
      next: () => {
        const idx = this.AllPatients.findIndex(p => p.patientID === patient.patientID);
        if (idx >= 0) {
          const clone = [...this.AllPatients];
          clone[idx] = patient;
          this.AllPatients = clone;
          this.grid?.api?.setRowData(this.AllPatients);
        }
        alert('The record of the patient has been updated');
        this.EditBtnPressed = false;
      }
    });
  }

  // ---------- Delete ----------
  deleteAction(id: number): void {
    if (this.AllVisits?.some(v => v.patientID == id)) {
      alert('Sorry this patient record cannot be deleted as this patient has a scheduled appointment');
      return;
    }

    this.dataService.deletePatientByID(id).subscribe({
      next: () => {
        this.AllPatients = this.AllPatients.filter(p => p.patientID !== id);
        this.grid?.api?.setRowData(this.AllPatients);
        alert('Deleted patient record successfully');
      }
    });
  }

  // ---------- Duplicate detection ----------
  private detectDuplicates(candidate: Patient, pool: Patient[]): { candidates: DuplicateCandidate[]; hard: boolean } {
    const out: DuplicateCandidate[] = [];
    let hard = false;

    const norm = (s: any) => (s ?? '').toString().trim().toLowerCase();
    const normPhone = (s: any) => (s ?? '').toString().replace(/\D+/g, '');
    const name0 = norm(candidate.patientName);
    const email0 = norm(candidate.patientEmail);
    const phone0 = normPhone(candidate.patientPhone);
    const id0 = candidate.patientID ?? null;

    for (const p of pool) {
      const reasons: string[] = [];
      let score = 0;

      const name  = norm(p.patientName);
      const email = norm(p.patientEmail);
      const phone = normPhone(p.patientPhone);

      // Hard conflicts
      if (id0 != null && p.patientID === id0) { reasons.push('Same patient ID'); score += 1.0; hard = true; }
      if (email0 && email && email0 === email) { reasons.push('Same email'); score += 0.9; hard = true; }
      if (phone0 && phone && phone0 === phone) { reasons.push('Same phone'); score += 0.9; hard = true; }

      // Soft similarity
      const nameSim = this.diceCoefficient(name0, name);
      if (name0 && name && nameSim >= 0.84) {
        reasons.push(`Similar name (${Math.round(nameSim * 100)}%)`);
        score += 0.5 * nameSim;
      }

      // Phone tail match
      if (phone0 && phone && phone0.length >= 7 && phone.length >= 7) {
        if (phone0.slice(-7) === phone.slice(-7)) { reasons.push('Phone tail matches'); score += 0.35; }
        else if (phone0.slice(-5) === phone.slice(-5)) { reasons.push('Phone last 5 match'); score += 0.2; }
      }

      // Email local-part similarity
      if (email0 && email) {
        const lp0 = email0.split('@')[0];
        const lp  = email.split('@')[0];
        const lpSim = this.diceCoefficient(lp0, lp);
        if (lp0 === lp) { reasons.push('Email local-part identical'); score += 0.25; }
        else if (lpSim >= 0.8) { reasons.push(`Email local-part similar (${Math.round(lpSim * 100)}%)`); score += 0.15; }
      }

      if (reasons.length > 0) {
        if (hard || score >= 0.5) {
          out.push({ patient: p, score: Math.min(1, score), reasons });
        }
      }
    }

    out.sort((a, b) => b.score - a.score);
    return { candidates: out, hard };
  }

  private diceCoefficient(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const bigrams = (s: string) => {
      const arr: string[] = [];
      for (let i = 0; i < s.length - 1; i++) arr.push(s.substring(i, i + 2));
      return arr;
    };
    const a2 = bigrams(a);
    const b2 = bigrams(b);
    if (a2.length === 0 || b2.length === 0) return 0;
    const map = new Map<string, number>();
    for (const g of a2) map.set(g, (map.get(g) ?? 0) + 1);
    let overlap = 0;
    for (const g of b2) {
      const c = map.get(g);
      if (c && c > 0) { overlap++; map.set(g, c - 1); }
    }
    return (2 * overlap) / (a2.length + b2.length);
  }

  // ---------- AG Grid events ----------
  onGridReady(e: GridReadyEvent) {
    e.api.setDomLayout('autoHeight');
    e.api.setGridOption('pagination', true);
    e.api.setGridOption('paginationPageSize', this.pageSize);
    e.api.setRowData(this.AllPatients || []);
    setTimeout(() => e.api.sizeColumnsToFit(), 0);
  }

  onFirstDataRendered(e: FirstDataRenderedEvent) {
    e.api.sizeColumnsToFit();
  }

  changePageSize(size: number | string) {
    this.pageSize = Number(size) || 10;
    this.grid?.api?.paginationSetPageSize(this.pageSize);
  }

  // ---------- lifecycle ----------
  ngOnInit(): void {
    // visits (for delete guard)
    this.visit_data.getAllVisits().subscribe({
      next: (res) => { this.AllVisits = res; },
      error: () => { alert('visit data Loading Failed'); }
    });

    // forms
    this.editPatientForm = new FormGroup({
      patientID:         new FormControl<number | null>(null, [Validators.required]),
      patientName:       new FormControl<string | null>('', [Validators.required, Validators.minLength(10)]),
      visitID:           new FormControl<number | null>(null),
      patientEmail:      new FormControl<string | null>('', [Validators.required, Validators.email, Validators.minLength(10)]),
      patientPhone:      new FormControl<string | null>('', [Validators.required]),
      patientDescription:new FormControl<string | null>('')
    });

    this.addPatientForm = new FormGroup({
      patientID:         new FormControl<number | null>(null, [Validators.required]),
      patientName:       new FormControl<string | null>('', [Validators.required, Validators.minLength(10)]),
      patientEmail:      new FormControl<string | null>('', [Validators.required, Validators.email, Validators.minLength(10)]),
      patientPhone:      new FormControl<string | null>('', [Validators.required]),
      patientDescription:new FormControl<string | null>('')
    });

    // Load patients
    this.dataService.getAllPatients().subscribe({
      next: (res) => {
        this.AllPatients = res ?? [];

        // next suggested ID
        this.last_id = this.AllPatients.length ? Math.max(...this.AllPatients.map(p => p.patientID ?? 0)) : 0;
        const idCtrl = this.addPatientForm.get('patientID');
        idCtrl?.setValue(Number(this.last_id) + 1);
        idCtrl?.setValidators([Validators.required, Validators.min(Number(this.last_id) + 1)]);
        idCtrl?.updateValueAndValidity();

        // if grid already ready, update rows
        this.grid?.api?.setRowData(this.AllPatients || []);
      },
      error: (err) => { alert(err); }
    });

    // global quick filter
    this.searchFC.valueChanges.subscribe(q => {
      this.grid?.api?.setQuickFilter((q ?? '').trim());
    });
  }
}
