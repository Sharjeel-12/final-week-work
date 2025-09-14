// src/app/visit-calendar/visit-calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { forkJoin } from 'rxjs';

import { VisitDataService } from '../Services/visits-data.service';
import { PatientDataService } from '../Services/patient-data.service';
import { DoctorDataService } from '../Services/doctor-data.service';
import { Visit } from '../models/visit';
import { Patient } from '../models/patient';
import { Doctor } from '../models/doctor';

@Component({
  selector: 'app-visit-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  providers: [VisitDataService, PatientDataService, DoctorDataService],
  template: `
    <div style="display:flex; gap:16px; align-items:flex-end; margin-bottom:12px;">
      <div>
        <label for="doctorFilter"><strong>Provider</strong></label><br />
        <select id="doctorFilter" [value]="doctorFilter" (change)="onDoctorFilterChange(($any($event.target).value))">
          <option value="ALL">All providers</option>
          @for (d of doctors; track d.doctorID) {
            <option [value]="d.doctorID">{{ d.doctorName }}</option>
          }
        </select>
      </div>

      @if (loading) { <span>Loading…</span> }
      @if (error)   { <span style="color:#b00020">{{ error }}</span> }
      <span style="opacity:.7">Events: {{ eventsCount }}</span>
    </div>

    <full-calendar [options]="calendarOptions"></full-calendar>
  `,
  styles: [`
    /* Month view: keep items tidy */
    :host ::ng-deep .fc-daygrid-event-dot { display: none; }
    :host ::ng-deep .fc-daygrid-event     { padding: 2px 4px; }

    /* Our two-line event block (used in all views) */
    :host ::ng-deep .fc-visit { line-height: 1.2; }
    :host ::ng-deep .fc-visit .line1 {
      font-weight: 600;
      display: flex;
      gap: .35rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host ::ng-deep .fc-visit .time { font-weight: 700; }
    :host ::ng-deep .fc-visit .patient {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host ::ng-deep .fc-visit .line2 {
      color: #555;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Week/Day (timeGrid) — hide default time/title; use our content only */
    :host ::ng-deep .fc-timegrid-event .fc-event-time,
    :host ::ng-deep .fc-timegrid-event .fc-event-title { display: none !important; }

    /* Comfortable padding for our custom content */
    :host ::ng-deep .fc-timegrid-event .fc-event-main { padding: 4px 6px; }

    /* Slightly smaller fonts fit 2 lines in a 30-min slot */
    :host ::ng-deep .fc-timegrid-event .fc-visit .line1 { font-size: 12px; }
    :host ::ng-deep .fc-timegrid-event .fc-visit .line2 { font-size: 11px; opacity: .9; }
  `]
})
export class VisitCalendarComponent implements OnInit {
  loading = true;
  error: string | null = null;

  // cached data
  visits: Visit[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];

  // 'ALL' or a specific doctorID (number)
  doctorFilter: 'ALL' | number = 'ALL';

  // for the little counter in the toolbar
  eventsCount = 0;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    slotMinTime: '09:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    businessHours: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '21:00' },

    // We render our own time text; hide FullCalendar's default
    displayEventTime: false,

    // Short events still readable
    eventMinHeight: 38,

    selectable: true,
    selectMirror: true,
    nowIndicator: true,
    events: [],

    // One renderer for all views
    eventContent: (arg) => {
      const v: any = arg.event.extendedProps?.['visit'];
      const start = arg.event.start!;
      const end = arg.event.end!;
      const fmt = (d: Date) =>
        new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);

      const div = document.createElement('div');
      div.className = 'fc-visit';
      div.innerHTML = `
        <div class="line1">
          <span class="time">${fmt(start)} – ${fmt(end)}</span>
          <span class="patient">${arg.event.extendedProps?.['patientName'] ?? ''}</span>
        </div>
        <div class="line2">
          ${arg.event.extendedProps?.['visitType'] ?? ''} • ${arg.event.extendedProps?.['doctorName'] ?? ''}
        </div>
      `;
      return { domNodes: [div] };
    },

    eventClick: (arg) => {
      const v: Visit | undefined = (arg.event.extendedProps as any)?.visit;
      if (v) console.log('clicked visit', v);
    },
  };

  constructor(
    private visitsSvc: VisitDataService,
    private patientsSvc: PatientDataService,
    private doctorsSvc: DoctorDataService
  ) {}

  ngOnInit(): void {
    forkJoin({
      visits: this.visitsSvc.getAllVisits(),
      patients: this.patientsSvc.getAllPatients(),
      doctors: this.doctorsSvc.getAllDoctors()
    }).subscribe({
      next: ({ visits, patients, doctors }) => {
        this.visits   = visits   ?? [];
        this.patients = patients ?? [];
        this.doctors  = doctors  ?? [];
        this.updateCalendarEvents();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load calendar data.';
        this.loading = false;
      }
    });
  }

  onDoctorFilterChange(val: string) {
    this.doctorFilter = (val === 'ALL') ? 'ALL' : Number(val);
    this.updateCalendarEvents();
  }

  private updateCalendarEvents() {
    const filtered = (this.doctorFilter === 'ALL')
      ? this.visits
      : this.visits.filter(v => Number(v.doctorID) === Number(this.doctorFilter));

    const events = this.mapToEvents(filtered, this.patients, this.doctors);
    this.eventsCount = events.length;

    // reassign options so FullCalendar re-renders
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private mapToEvents(visits: Visit[], patients: Patient[], doctors: Doctor[]): EventInput[] {
    return visits.map(v => {
      const start = parseServerDate(v.visitDate!);
      const end   = new Date(start.getTime() + (v.visitDuration ?? 0) * 60000);
      const pName = patients.find(p => p.patientID === v.patientID)?.patientName ?? `Patient #${v.patientID}`;
      const dName = doctors.find(d => d.doctorID === v.doctorID)?.doctorName ?? `Doctor #${v.doctorID}`;

      return {
        id: String(v.visitID),
        // leave title empty so FC doesn't paint its own text
        title: '',
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: {
          visit: v,
          patientName: pName,
          doctorName: dName,
          visitType: v.visitType ?? ''
        }
      };
    });
  }
}

/* helpers */
function parseServerDate(value?: string | null): Date {
  if (!value) return new Date();
  const hasZone = /Z|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasZone ? value : value + 'Z');
}
