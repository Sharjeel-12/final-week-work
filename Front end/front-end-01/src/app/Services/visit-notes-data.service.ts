import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VisitNote, CreateVisitNoteDto, UpdateVisitNoteDto,
  Rule, Billing, CreateBillingDto,
  VisitNoteItem, CreateVisitNoteItemDto, UpdateVisitNoteItemDto,
  BillingPreviewDto
} from '../models/visit-note';

function authHeaders(): HttpHeaders {
  return new HttpHeaders({
    'Authorization': 'Bearer ' + sessionStorage.getItem('access_token'),
    'Content-Type': 'application/json'
  });
}

/* ---------- NOTES ---------- */
@Injectable({ providedIn: 'root' })
export class VisitNotesDataService {
  private base = 'http://localhost:49428/api/VisitNotes';
  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitNote[]> {
    return this.http.get<VisitNote[]>(this.base, { headers: authHeaders() });
  }
  getById(id: number): Observable<VisitNote> {
    return this.http.get<VisitNote>(`${this.base}/${id}`, { headers: authHeaders() });
  }
  getByVisit(visitId: number): Observable<VisitNote> {
    return this.http.get<VisitNote>(`${this.base}/byVisit/${visitId}`, { headers: authHeaders() });
  }
  create(dto: CreateVisitNoteDto): Observable<{ id: number } | void> {
    return this.http.post<{ id: number } | void>(this.base, dto, { headers: authHeaders() });
  }
  update(id: number, dto: UpdateVisitNoteDto): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto, { headers: authHeaders() });
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: authHeaders() });
  }
}

/* ---------- ITEMS ---------- */
@Injectable({ providedIn: 'root' })
export class VisitNoteItemsDataService {
  private base = 'http://localhost:49428/api/VisitNoteItems';
  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token =
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // GET /api/VisitNoteItems?notesId=5
  list(notesId: number) {
    return this.http.get<VisitNoteItem[]>(
      `${this.base}?notesId=${notesId}`,
      { headers: this.authHeaders() }
    );
  }

  // POST /api/VisitNoteItems   body must include notesID
  add(notesId: number, dto: CreateVisitNoteItemDto) {
    return this.http.post<{ id: number } | void>(
      this.base,
      { notesID: notesId, ruleID: dto.ruleID, quantity: dto.quantity },
      { headers: this.authHeaders() }
    );
  }

  // PUT /api/VisitNoteItems/{itemId}
  update(_notesId: number, dto: UpdateVisitNoteItemDto) {
    return this.http.put<void>(
      `${this.base}/${dto.itemID}`,
      dto,
      { headers: this.authHeaders() }
    );
  }

  // DELETE /api/VisitNoteItems/{itemId}
  remove(_notesId: number, itemId: number) {
    return this.http.delete<void>(
      `${this.base}/${itemId}`,
      { headers: this.authHeaders() }
    );
  }
}


/* ---------- RULES ---------- */
@Injectable({ providedIn: 'root' })
export class RulesDataService {
  private base = 'http://localhost:49428/api/Rules';
  constructor(private http: HttpClient) {}
  getAll(): Observable<Rule[]> {
    return this.http.get<Rule[]>(this.base, { headers: authHeaders() });
  }
}

/* ---------- BILLING ---------- */
@Injectable({ providedIn: 'root' })
export class BillingDataService {
  private base = 'http://localhost:49428/api/Billing';
  constructor(private http: HttpClient) {}

  preview(notesId: number): Observable<BillingPreviewDto> {
    return this.http.get<BillingPreviewDto>(`${this.base}/preview/${notesId}`, { headers: authHeaders() });
  }
  create(dto: CreateBillingDto): Observable<{ id: number } | void> {
    return this.http.post<{ id: number } | void>(this.base, dto, { headers: authHeaders() });
  }
  getByNote(notesId: number): Observable<Billing> {
    return this.http.get<Billing>(`${this.base}/byNote/${notesId}`, { headers: authHeaders() });
  }
}
