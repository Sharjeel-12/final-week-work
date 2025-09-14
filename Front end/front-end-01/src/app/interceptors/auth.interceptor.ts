import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, defer } from 'rxjs';
import { catchError } from 'rxjs/operators';

const PUBLIC_PATHS = ['/api/auth/register', '/api/auth/login'];

function isPublicUrl(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');
    return PUBLIC_PATHS.some(p => path.endsWith(p));
  } catch {
    const path = url.toLowerCase().split('?')[0].replace(/\/+$/, '');
    return PUBLIC_PATHS.some(p => path.endsWith(p));
  }
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const router = inject(Router);

  // Explicit skip header
  if (req.headers.has('x-skip-auth') || isPublicUrl(req.url)) {
    const clean = req.headers.has('x-skip-auth')
      ? req.clone({ headers: req.headers.delete('x-skip-auth') })
      : req;
    return next(clean);
  }

  const token = sessionStorage.getItem('access_token');
  if (token) {
    if (isTokenExpired(token)) {
      sessionStorage.clear();
      return defer(() => {
        router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } });
        return throwError(() => new Error('Session expired'));
      });
    }
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        sessionStorage.clear();
        router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } });
      }
      return throwError(() => error);
    })
  );
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp !== 'number' || payload.exp < now;
  } catch {
    return true;
  }
}
