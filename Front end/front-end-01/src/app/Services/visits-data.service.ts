import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visit, CreateVisitDto, UpdateVisitDto, VisitStatus } from '../models/visit';

@Injectable({ providedIn: 'root' })
export class VisitDataService {
  private apiUrl = 'http://localhost:49428/api/Visits';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + sessionStorage.getItem('access_token'),
      'Content-Type': 'application/json'
    });
  }

  getAllVisits(): Observable<Visit[]> {
    return this.http.get<Visit[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getVisitById(id: number): Observable<Visit> {
    return this.http.get<Visit>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  addVisit(body: CreateVisitDto): Observable<Visit | void> {
    // Ensure default status if caller omitted it
    if (!body.status) body.status = 'pending';
    return this.http.post<Visit | void>(this.apiUrl, body, { headers: this.getAuthHeaders() });
  }

  updateVisit(id: number, body: UpdateVisitDto): Observable<Visit | void> {
    return this.http.put<Visit | void>(`${this.apiUrl}/${id}`, body, { headers: this.getAuthHeaders() });
  }

  deleteVisit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
