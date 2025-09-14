import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BillingSummaryDto } from '../models/billing';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingPaymentsService {
  private base = `${environment.apiBase}/Billing`;

  constructor(private http: HttpClient) {}

  private auth(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (sessionStorage.getItem('access_token') || ''),
      'Content-Type': 'application/json'
    });
  }

  summary(notesId: number): Observable<BillingSummaryDto> {
    return this.http.get<BillingSummaryDto>(`${this.base}/summary/${notesId}`, {
      headers: this.auth()
    });
  }
}
