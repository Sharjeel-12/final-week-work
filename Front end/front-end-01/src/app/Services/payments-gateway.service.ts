import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BillingSummaryDto,
  CreateIntentDto,
  CreateIntentResponse
} from '../models/billing';
import { environment } from '../../environments/environment';
export interface RecordCashDto { notesId: number; amount: number; reference?: string | null; }
export interface RecordCashResponse { billingID: number; newPaid: number; newBalance: number; }
@Injectable({ providedIn: 'root' })
export class PaymentsGatewayService {
  private base = `${environment.apiBase}/payments`;      // POST /payments/intent
  private billingBase = `${environment.apiBase}/billing`; // GET  /billing/summary/{notesId}

  constructor(private http: HttpClient) {}

  private auth(): HttpHeaders {
    const token =
      sessionStorage.getItem('access_token') || localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /** Current totals & payments for a visit note */
  getSummary(notesId: number): Observable<BillingSummaryDto> {
    return this.http.get<BillingSummaryDto>(
      `${this.billingBase}/summary/${notesId}`,
      { headers: this.auth() }
    );
  }

  /** Full payment (no amount) or partial payment (amount provided) */
  createIntent(notesId: number, amount?: number): Observable<CreateIntentResponse> {
    const body: CreateIntentDto = amount ? { notesId, amount } : { notesId };
    return this.http.post<CreateIntentResponse>(`${this.base}/intent`, body, {
      headers: this.auth()
    });
  }

// NEW: record cash payment
  recordCash(notesId: number, amount: number, reference?: string | null): Observable<RecordCashResponse> {
    const body: RecordCashDto = { notesId, amount, reference: reference?.trim() || undefined };
    return this.http.post<RecordCashResponse>(`${this.base}/cash`, body, { headers: this.auth() });
  }
  


}
