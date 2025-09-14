import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

function getRole(): string | null {
  const role = sessionStorage.getItem('role');
  return role ? role.trim() : null;
}

export function roleGuard(allowed: string[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const role = getRole();
    if (role && allowed.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
}
