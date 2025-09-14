import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoctorDataService } from '../Services/doctor-data.service';
import { VisitDataService } from '../Services/visits-data.service';
import { Doctor } from '../models/doctor';
import { CreateDoctorDto } from '../models/create-doctor-dto';
import { Visit } from '../models/visit';

import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ColGroupDef, GridReadyEvent, FirstDataRenderedEvent } from 'ag-grid-community';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, AgGridAngular],
  providers: [DoctorDataService],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent implements OnInit {

  constructor(private dataService: DoctorDataService, private visit_data: VisitDataService) {}

  math = Math;

  // ===== Forms =====
  addDoctorForm!: FormGroup;
  editDoctorForm!: FormGroup;
  get AddForm() { return this.addDoctorForm.controls; }
  get EditForm() { return this.editDoctorForm.controls; }

  // ===== Data =====
  AllDoctors: Doctor[] = [];
  AllVisits!: Visit[];

  AddBtnPressed = false;
  EditBtnPressed = false;

  last_id!: number | null | undefined;

  // ===== Search (wired to AG Grid quick filter) =====
  searchFC = new FormControl<string>('', { nonNullable: true });

  // ===== Pagination (native AG Grid) =====
  pageSize = 5;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // ===== AG Grid refs & defs =====
  @ViewChild(AgGridAngular) grid!: AgGridAngular;

  columnDefs: (ColDef | ColGroupDef)[] = [
    { headerName: 'Doctor ID', field: 'doctorID', width: 120 },
    { headerName: 'Doctor Name', field: 'doctorName' },
    { headerName: 'Doctor Email', field: 'doctorEmail' },
    { headerName: 'Doctor Phone', field: 'doctorPhone', width: 180 },
    { headerName: 'Doctor Description', field: 'specialization' },
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
        const row: Doctor = params.data;
        if (action === 'edit') this.activateEditForm(row);
        if (action === 'delete') this.deleteAction(row.doctorID!);
      }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,          // built-in text filter
    floatingFilter: true,  // small filter row under headers
    resizable: true,
    flex: 1,
    minWidth: 120,
    suppressHeaderMenuButton: true
  };

  // ===== UI =====
  activateForm(): void { this.AddBtnPressed = true; this.EditBtnPressed = false; }
  deactivateForm(): void { this.AddBtnPressed = false; }
  deactivateEditForm(): void { this.EditBtnPressed = false; }

  // ===== Add =====
  onSubmit(): void {
    const dto: CreateDoctorDto = {
      doctorID: this.addDoctorForm.value.doctorID,
      doctorName: this.addDoctorForm.value.doctorName,
      doctorEmail: this.addDoctorForm.value.doctorEmail,
      doctorPhone: this.addDoctorForm.value.doctorPhone,
      specialization: this.addDoctorForm.value.specialization
    };

    const doctor: Doctor = {
      doctorID: this.addDoctorForm.value.doctorID,
      visitID: null,
      doctorName: this.addDoctorForm.value.doctorName,
      doctorEmail: this.addDoctorForm.value.doctorEmail,
      doctorPhone: this.addDoctorForm.value.doctorPhone,
      specialization: this.addDoctorForm.value.specialization
    };

    if (this.AllDoctors.some(d => d.doctorID === doctor.doctorID) && doctor.doctorID != null) {
      alert('The doctor ID you just entered already exists. Please try a unique value for each doctor');
      return;
    }
    if (this.AllDoctors.some(d => d.doctorEmail === doctor.doctorEmail) && doctor.doctorEmail) {
      alert('The doctor email you just entered already exists. Please try a unique email for each doctor');
      return;
    }

    this.dataService.AddNewDoctor(dto).subscribe({
      next: () => {
        // create a NEW array reference so Angular change detection updates the grid
        this.AllDoctors = [...this.AllDoctors, doctor];
        alert('Doctor Added Successfully');
        this.AddBtnPressed = false;

        this.last_id = this.AllDoctors.length ? Math.max(...this.AllDoctors.map(d => d.doctorID ?? 0)) : 0;
        const idCtrl = this.addDoctorForm.get('doctorID');
        idCtrl?.setValue(Number(this.last_id) + 1);
        idCtrl?.setValidators([Validators.required, Validators.min(Number(this.last_id) + 1)]);
        idCtrl?.updateValueAndValidity();
      },
      error: (err) => { alert(err); }
    });
  }

  // ===== Edit =====
  activateEditForm(d: Doctor): void {
    this.editDoctorForm.patchValue({
      doctorID: d.doctorID,
      visitID: d.visitID ?? null,
      doctorName: d.doctorName,
      doctorEmail: d.doctorEmail,
      doctorPhone: d.doctorPhone,
      specialization: d.specialization ?? ''
    });
    this.EditBtnPressed = true;
    this.AddBtnPressed = false;
  }

  onEdit(): void {
    const doctor: Doctor = {
      doctorID: this.editDoctorForm.value.doctorID,
      visitID: this.editDoctorForm.value.visitID,
      doctorName: this.editDoctorForm.value.doctorName,
      doctorEmail: this.editDoctorForm.value.doctorEmail,
      doctorPhone: this.editDoctorForm.value.doctorPhone,
      specialization: this.editDoctorForm.value.specialization
    };

    const others = this.AllDoctors.filter(d => d.doctorID !== doctor.doctorID);
    if (others.some(d => d.doctorEmail === doctor.doctorEmail) && doctor.doctorEmail) {
      alert('The doctor email you just entered already exists. Please try a unique email for each doctor');
      return;
    }

    this.dataService.UpdateDoctor(doctor.doctorID, doctor).subscribe({
      next: () => {
        const idx = this.AllDoctors.findIndex(d => d.doctorID === doctor.doctorID);
        if (idx >= 0) {
          const clone = [...this.AllDoctors];
          clone[idx] = doctor;
          this.AllDoctors = clone; // new ref for change detection
        }
        alert('The record of the doctor has been updated');
        this.EditBtnPressed = false;
      }
    });
  }

  // ===== Delete =====
  deleteAction(id: number): void {
    if (this.AllVisits?.some(v => v.doctorID == id)) {
      alert('Sorry this doctor record cannot be deleted as this doctor has a scheduled appointment');
      return;
    }

    this.dataService.deleteDoctorByID(id).subscribe({
      next: () => {
        this.AllDoctors = this.AllDoctors.filter(d => d.doctorID !== id);
        alert('deleted doctor record successfully');
      }
    });
  }

  // ===== AG Grid events =====
  onGridReady(e: GridReadyEvent) {
    e.api.setDomLayout('autoHeight');
    e.api.setGridOption('pagination', true);
    e.api.setGridOption('paginationPageSize', this.pageSize);
    e.api.setRowData(this.AllDoctors || []);
    setTimeout(() => e.api.sizeColumnsToFit(), 0);
  }

  onFirstDataRendered(e: FirstDataRenderedEvent) {
    e.api.sizeColumnsToFit();
  }

  changePageSize(size: number | string) {
    this.pageSize = Number(size) || 10;
    if (this.grid?.api) this.grid.api.paginationSetPageSize(this.pageSize);
  }

  // ===== Init =====
  ngOnInit(): void {
    // visits for delete guard
    this.visit_data.getAllVisits().subscribe({
      next: (res) => { this.AllVisits = res; },
      error: () => { alert('visit data Loading Failed'); }
    });

    // forms
    this.editDoctorForm = new FormGroup({
      doctorID:     new FormControl<number | null>(null, [Validators.required]),
      doctorName:   new FormControl<string | null>('', [Validators.required, Validators.minLength(3)]),
      visitID:      new FormControl<number | null>(null),
      doctorEmail:  new FormControl<string | null>('', [Validators.required, Validators.email, Validators.minLength(6)]),
      doctorPhone:  new FormControl<string | null>('', [Validators.required]),
      specialization: new FormControl<string | null>('')
    });

    this.addDoctorForm = new FormGroup({
      doctorID:     new FormControl<number | null>(null, [Validators.required]),
      doctorName:   new FormControl<string | null>('', [Validators.required, Validators.minLength(3)]),
      doctorEmail:  new FormControl<string | null>('', [Validators.required, Validators.email, Validators.minLength(6)]),
      doctorPhone:  new FormControl<string | null>('', [Validators.required]),
      specialization: new FormControl<string | null>('')
    });

    // data
    this.dataService.getAllDoctors().subscribe({
      next: (res) => {
        this.AllDoctors = res ?? [];

        // next ID
        this.last_id = this.AllDoctors.length ? Math.max(...this.AllDoctors.map(d => d.doctorID ?? 0)) : 0;
        const idCtrl = this.addDoctorForm.get('doctorID');
        idCtrl?.setValue(Number(this.last_id) + 1);
        idCtrl?.setValidators([Validators.required, Validators.min(Number(this.last_id) + 1)]);
        idCtrl?.updateValueAndValidity();

        // prime grid if it's already ready
        if (this.grid?.api) this.grid.api.setRowData(this.AllDoctors || []);
      },
      error: () => { alert('Failed to load doctor data'); }
    });

    // global quick filter
    this.searchFC.valueChanges.subscribe((q) => {
      this.grid?.api?.setQuickFilter((q ?? '').trim());
    });
  }
}
