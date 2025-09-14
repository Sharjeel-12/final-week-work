import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OutstandingBalanceRow, DailyCollectionDto } from '../models/reports';

@Injectable({ providedIn: 'root' })
export class ReportsDataService {
  private base = `${environment.apiBase}/reports`;
  constructor(private http: HttpClient) {}

  private auth(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (sessionStorage.getItem('access_token') || '')
    });
  }

  getOutstanding(opts: {
    upTo?: string;              // 'YYYY-MM-DD'
    patientId?: number;
    doctorId?: number;
    minBalance?: number;
    q?: string;                 // name contains
  }): Observable<OutstandingBalanceRow[]> {
    let params = new HttpParams();
    if (opts.upTo)       {params = params.set('upTo', opts.upTo);}
    if (opts.patientId)  {params = params.set('patientId', String(opts.patientId));}
    if (opts.doctorId)   {params = params.set('doctorId', String(opts.doctorId));}
    if (opts.minBalance !== undefined && opts.minBalance !== null){
      params = params.set('minBalance', String(opts.minBalance));
      
    }
    if (opts.q) {
      params = params.set('q', opts.q);} 
    return this.http.get<OutstandingBalanceRow[]>(`${this.base}/outstanding`, { headers: this.auth(), params });
  }

  getCollections(dateYmd: string): Observable<DailyCollectionDto> {
    const params = new HttpParams().set('date', dateYmd);
    return this.http.get<DailyCollectionDto>(`${this.base}/collections`, { headers: this.auth(), params });
  }
}
