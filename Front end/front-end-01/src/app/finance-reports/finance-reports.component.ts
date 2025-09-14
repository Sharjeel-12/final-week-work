import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsDataService } from '../Services/reports-data.service';
import { OutstandingBalanceRow, DailyCollectionDto } from '../models/reports';

@Component({
  selector: 'app-finance-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-reports.component.html',
  styleUrls: ['./finance-reports.component.scss']
})
export class FinanceReportsComponent {
  tab: 'outstanding' | 'collections' = 'outstanding';

  // Filters – Outstanding
  upTo?: string;               // yyyy-mm-dd
  q = '';
  minBalance: number = 0;
  doctorId?: number;           // optional future filter
  patientId?: number;

  outstanding: OutstandingBalanceRow[] = [];
  loadingOutstanding = false;

  // Collections
  collDate: string = this.todayYmd();
  collections?: DailyCollectionDto;
  loadingCollections = false;

  message = '';

  constructor(private reports: ReportsDataService) {}

  // Helpers
  private todayYmd(): string {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  fmtMoney(n: number | undefined | null): string {
    const v = Number(n ?? 0);
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  // Loaders
  loadOutstanding(): void {
    this.loadingOutstanding = true; this.message = '';
    this.reports.getOutstanding({
      upTo: this.upTo,
      q: this.q?.trim() || undefined,
      minBalance: this.minBalance ?? 0,
      doctorId: this.doctorId,
      patientId: this.patientId
    }).subscribe({
      next: rows => { this.outstanding = rows || []; },
      error: e => { this.message = this.extractErr(e); },
      complete: () => this.loadingOutstanding = false
    });
  }

  loadCollections(): void {
    if (!this.collDate) this.collDate = this.todayYmd();
    this.loadingCollections = true; this.message = '';
    this.reports.getCollections(this.collDate).subscribe({
      next: dto => this.collections = dto,
      error: e => this.message = this.extractErr(e),
      complete: () => this.loadingCollections = false
    });
  }

  // CSV Export
  exportOutstandingCsv(): void {
    const rows = this.outstanding;
    if (!rows?.length) return;
    const header = ['Patient ID','Patient','Total Billed','Total Paid','Balance','Last Visit','Notes'];
    const data = rows.map(r => [
      r.patientID,
      safe(r.patientName),
      r.totalBilled,
      r.totalPaid,
      r.balance,
      r.lastVisitDate ? new Date(r.lastVisitDate).toLocaleString() : '',
      r.notesCount
    ]);
    this.downloadCsv('outstanding.csv', [header, ...data]);
  }

  exportCollectionsCsv(): void {
    const dto = this.collections;
    const rows = dto?.rows || [];
    if (!rows.length) return;
    const header = ['Date','Method','Reference','Amount','Patient','NotesID','BillingID','By'];
    const data = rows.map(r => [
      new Date(r.createdAt).toLocaleString(),
      r.method,
      safe(r.reference || ''),
      r.amount,
      safe(r.patientName),
      r.notesID,
      r.billingID,
      safe(r.createdByName || String(r.createdBy ?? ''))
    ]);
    this.downloadCsv(`collections_${this.collDate}.csv`, [header, ...data]);
  }

  private downloadCsv(filename: string, rows: (string | number)[][]): void {
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private extractErr(e: any): string {
    if (e?.error) {
      if (typeof e.error === 'string') return e.error;
      if (e.error?.message) return e.error.message;
      return JSON.stringify(e.error);
    }
    return e?.message || 'Unexpected error';
  }
  // Safely get object keys for templates
keys<T extends object>(obj: T | null | undefined): string[] {
  return obj ? Object.keys(obj as any) : [];
}

}
function safe(s: string) { return (s ?? '').replace(/\r?\n/g, ' ').trim(); }
