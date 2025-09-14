// Matches your API payloads (GET/CREATE/UPDATE) including visitFee and status.

export type VisitStatus = 'pending' | 'scheduled';

export interface Visit {
  visitID: number | null;
  visitType: string | null;      // "Emergency" | "Follow-Up" | "Consultation"
  visitTypeID: number | null;    // e.g., 1/2/3
  visitDuration: number | null;  // minutes
  visitDate: string;             // ISO-like string e.g. "2025-08-08T00:14:00Z"
  visitFee: number | null;       // e.g., 17000
  patientID: number | null;
  doctorID: number | null;
  status: VisitStatus;           // NEW
}

export interface CreateVisitDto {
  visitID?: number | null;       // include if your API accepts it on create
  visitType: string;
  visitTypeID: number;
  visitDuration: number;
  visitDate: string;
  visitFee: number;
  patientID: number;
  doctorID: number;
  status?: VisitStatus;          // NEW (defaults server-side to "pending")
}

export interface UpdateVisitDto {
  visitID: number;               // id being updated (also in URL)
  visitType: string;
  visitTypeID: number;
  visitDuration: number;
  visitDate: string;
  visitFee: number;
  patientID: number;
  doctorID: number;
  status: VisitStatus;           // NEW
}
