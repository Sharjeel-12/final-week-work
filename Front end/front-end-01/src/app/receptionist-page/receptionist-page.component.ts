import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Route, Router } from '@angular/router';
import { PatientDashboardComponent } from '../patient-dashboard/patient-dashboard.component';
import { DoctorDashboardComponent } from '../doctor-dashboard/doctor-dashboard.component';
import { VisitDashboardComponent } from '../visit-dashboard/visit-dashboard.component';
import { FeeDashboardComponent } from '../fee-dashboard/fee-dashboard.component';

@Component({
  selector: 'app-receptionist-page',
  standalone: true,
  imports: [RouterOutlet, RouterLink, PatientDashboardComponent,DoctorDashboardComponent,VisitDashboardComponent,FeeDashboardComponent],
  templateUrl: './receptionist-page.component.html',
  styleUrl: './receptionist-page.component.scss'
})
export class ReceptionistPageComponent {

constructor(private router: Router) {}

  logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

}
