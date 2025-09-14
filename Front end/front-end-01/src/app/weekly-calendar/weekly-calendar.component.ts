import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { VisitDataService } from '../Services/visits-data.service';
import { DoctorDataService } from '../Services/doctor-data.service';
import { PatientDataService } from '../Services/patient-data.service';
import { Visit } from '../models/visit';
import { Doctor } from '../models/doctor';
import { Patient } from '../models/patient';

type Slot = {
  status: 'free' | 'booked';
  visit?: Visit | null;
};

@Component({
  selector: 'app-weekly-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './weekly-calendar.component.html',
  styleUrls: ['./weekly-calendar.component.scss']
})
export class WeeklyCalendarComponent implements OnInit {
  // ------- Config -------
  readonly SLOT_MIN = 15;
  readonly DAY_START_HOUR = 9;
  readonly DAY_END_HOUR = 21; // exclusive end bound
  readonly WORKING_DAYS = [1,2,3,4,5,6]; // Mon-Sat

  // ------- Data -------
  AllVisits: Visit[] = [];
  AllDoctors: Doctor[] = [];
  AllPatients: Patient[] = [];

  // ------- UI state -------
  selectedDoctorId = new FormControl<number | null>(null, { nonNullable: false });
  weekStartDate: Date = startOfWeek(new Date()); // Monday

  // ------- Precomputed for template (no function calls) -------
  hours: number[] = [];                // [0..hoursCount-1]
  quarters: number[] = [];             // [0..quartersPerHour-1]
  quartersPerHour = 60 / this.SLOT_MIN;
  hoursCount = this.DAY_END_HOUR - this.DAY_START_HOUR;

  weekDaysArr: Date[] = [];            // 7 dates Mon..Sun
  // Grid: [dayIndex 0..6][hourIndex 0..hoursCount-1][quarterIndex 0..quartersPerHour-1]
  gridSlots: Slot[][][] = [];

  // Label like "Mon, Sep 8 – Sun, Sep 14"
  weekRangeLabel = '';

  constructor(
    private visitSvc: VisitDataService,
    private doctorSvc: DoctorDataService,
    private patientSvc: PatientDataService
  ) {
    this.hours = Array.from({ length: this.hoursCount }, (_, i) => i);
    this.quarters = Array.from({ length: this.quartersPerHour }, (_, i) => i);
  }

  ngOnInit(): void {
    this.patientSvc.getAllPatients().subscribe({ next: res => this.AllPatients = res ?? [] });

    this.doctorSvc.getAllDoctors().subscribe({
      next: res => {
        this.AllDoctors = res ?? [];
        if (this.AllDoctors.length && !this.selectedDoctorId.value) {
          this.selectedDoctorId.setValue(this.AllDoctors[0].doctorID ?? null, { emitEvent: false });
        }
        this.recomputeGrid();
      }
    });

    this.visitSvc.getAllVisits().subscribe({
      next: res => { this.AllVisits = res ?? []; this.recomputeGrid(); }
    });

    this.selectedDoctorId.valueChanges.subscribe(() => this.recomputeGrid());
  }

  // ------- Week navigation (keeps provider) -------
  goPrevWeek() { this.weekStartDate = addDays(this.weekStartDate, -7); this.recomputeGrid(); }
  goNextWeek() { this.weekStartDate = addDays(this.weekStartDate, +7); this.recomputeGrid(); }
  goThisWeek() { this.weekStartDate = startOfWeek(new Date()); this.recomputeGrid(); }

  // ------- Core precomputation (called on any dependency change) -------
  private recomputeGrid(): void {
    // Week days Mon..Sun
    this.weekDaysArr = Array.from({ length: 7 }, (_, i) => addDays(this.weekStartDate, i));
    const rangeStart = this.weekDaysArr[0];
    const rangeEnd = addDays(rangeStart, 7);

    // Label
    const dp = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    this.weekRangeLabel = `${dp.format(this.weekDaysArr[0])} – ${dp.format(this.weekDaysArr[6])}`;

    // Filter visits by doctor and week
    const drId = Number(this.selectedDoctorId.value || 0);
    const weekVisits = drId
      ? this.AllVisits.filter(v => {
          if (Number(v.doctorID) !== drId) return false;
          if (!v.visitDate) return false;
          const sd = parseServerDate(v.visitDate);
          return sd >= rangeStart && sd < rangeEnd;
        })
      : [];

    // Init empty grid (all free)
    this.gridSlots = Array.from({ length: 7 }, () =>
      Array.from({ length: this.hoursCount }, () =>
        Array.from({ length: this.quartersPerHour }, () => ({ status: 'free' } as Slot))
      )
    );

    // Pre-fill booked cells per day using arithmetic (no per-slot scans)
    for (let di = 0; di < 7; di++) {
      const day = this.weekDaysArr[di];
      const dow = day.getDay();
      const isWorkingDay = this.WORKING_DAYS.includes(dow);

      // Working window for the day
      const dayStart = setHM(day, this.DAY_START_HOUR, 0);
      const dayEnd   = setHM(day, this.DAY_END_HOUR, 0);

      // If not working day: leave as 'free' (or you can mark differently if you want)
      if (!isWorkingDay) continue;

      // Today's visits
      const todays = weekVisits.filter(v => isSameDay(parseServerDate(v.visitDate!), day));

      for (const v of todays) {
        const vr = intervalFromServer(v.visitDate!, Number(v.visitDuration ?? 0));

        // Clamp visit to working window
        const s = new Date(Math.max(+vr.start, +dayStart));
        const e = new Date(Math.min(+vr.end, +dayEnd));
        if (!(s < e)) continue;

        // Convert to slot indices
        const firstSlot = Math.max(0, Math.floor((+s - +dayStart) / (this.SLOT_MIN * 60_000)));
        const lastSlotExclusive = Math.min(this.hoursCount * this.quartersPerHour,
          Math.ceil((+e - +dayStart) / (this.SLOT_MIN * 60_000))
        );

        for (let k = firstSlot; k < lastSlotExclusive; k++) {
          const hi = Math.floor(k / this.quartersPerHour);
          const qi = k % this.quartersPerHour;
          const cell = this.gridSlots[di]?.[hi]?.[qi];
          if (cell) {
            cell.status = 'booked';
            cell.visit = v;
          }
        }
      }
    }
  }
}

/* ===================== helpers (not called from template) ===================== */

function parseServerDate(value: string): Date {
  if (!value) return new Date(NaN);
  const hasZone = /Z|[+-]\d{2}:\d{2}$/.test(value);
  const normalized = hasZone ? value : value + 'Z';
  return new Date(normalized);
}

function intervalFromServer(isoOrNaive: string, durationMin: number): { start: Date; end: Date } {
  const start = parseServerDate(isoOrNaive);
  const end   = new Date(start.getTime() + durationMin * 60_000);
  return { start, end };
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay() || 7; // Sun=0 -> 7
  if (day !== 1) x.setDate(x.getDate() - (day - 1));
  x.setHours(0,0,0,0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function setHM(d: Date, h: number, m: number) {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}
