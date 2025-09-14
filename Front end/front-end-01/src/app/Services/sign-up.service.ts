import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SignUpBody {
  email: string;
  password: string;
  role?: string;              // make optional
  confirmPassword?: string;   // add if backend requires
  userName?: string;          // add if backend requires
}

@Injectable({ providedIn: 'root' })
export class SignUpService {
  base_url = "http://localhost:49428/api/Auth/register";

  constructor(private http: HttpClient) {}

  private compact<T extends object>(o: T): Partial<T> {
    const out: any = {};
    for (const [k, v] of Object.entries(o)) {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    }
    return out;
  }

  registerUser(body: SignUpBody): Observable<any> {
    return this.http.post<any>(this.base_url,body, {
      headers: new HttpHeaders({ 'x-skip-auth': 'true' }) // force skip interceptor
    });
  }
}
