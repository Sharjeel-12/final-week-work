import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['Admin'])],
    loadComponent: () =>
      import('./admin-page/admin-page.component').then(m => m.AdminPageComponent),
    children: [
      {
        path: 'patients',
        canActivate: [authGuard, roleGuard(['Admin'])],
        loadComponent: () =>
          import('./patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent)
      },
      {
        path: 'doctors',
        canActivate: [authGuard, roleGuard(['Admin'])],
        loadComponent: () =>
          import('./doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent)
      },
      {
        path: 'week-calendar',
        canActivate: [authGuard, roleGuard(['Admin'])],
        loadComponent: () =>
          import('./visit-calendar/visit-calendar.component').then(m => m.VisitCalendarComponent)
      },
      {
        path: 'visits',
        canActivate: [authGuard, roleGuard(['Admin'])],
        loadComponent: () =>
          import('./visit-dashboard/visit-dashboard.component').then(m => m.VisitDashboardComponent)
      },
      {
        path: 'fee-schedule',
        canActivate: [authGuard, roleGuard(['Admin'])],
        loadComponent: () =>
          import('./fee-dashboard/fee-dashboard.component').then(m => m.FeeDashboardComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'patients' }
    ]
  },
  {
    path: 'receptionist',
    canActivate: [authGuard, roleGuard(['Receptionist'])],
    loadComponent: () =>
      import('./receptionist-page/receptionist-page.component').then(m => m.ReceptionistPageComponent),
    children: [
      {
        path: 'patients',
        canActivate: [authGuard, roleGuard(['Receptionist'])],
        loadComponent: () =>
          import('./patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent)
      },
      {
        path: 'doctors',
        canActivate: [authGuard, roleGuard(['Receptionist'])],
        loadComponent: () =>
          import('./doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent)
      },
      {
        path: 'visits',
        canActivate: [authGuard, roleGuard(['Receptionist'])],
        loadComponent: () =>
          import('./visit-dashboard/visit-dashboard.component').then(m => m.VisitDashboardComponent)
      },
      {
        path: 'week-calendar',
        canActivate: [authGuard, roleGuard(['Receptionist'])],
        loadComponent: () =>
          import('./visit-calendar/visit-calendar.component').then(m => m.VisitCalendarComponent)
      },
      {
        path: 'fee-schedule',
        canActivate: [authGuard, roleGuard(['Receptionist'])],
        loadComponent: () =>
          import('./fee-dashboard/fee-dashboard.component').then(m => m.FeeDashboardComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'patients' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
