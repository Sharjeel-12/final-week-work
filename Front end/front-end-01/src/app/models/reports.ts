export interface OutstandingBalanceRow {
  patientID: number;
  patientName: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  lastVisitDate?: string | null;
  notesCount: number;
}

export interface DailyCollectionRow {
  paymentID: number;
  createdAt: string; // ISO
  method: string;
  reference?: string | null;
  amount: number;
  billingID: number;
  notesID: number;
  patientID: number;
  patientName: string;
  createdBy?: number | null;
  createdByName?: string | null;
}

export interface DailyCollectionDto {
  forDate: string; // ISO date
  total: number;
  byMethod: Record<string, number>;
  rows: DailyCollectionRow[];
}
