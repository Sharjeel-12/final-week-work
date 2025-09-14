import { Component, OnInit } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { LoginService } from '../Services/login.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminPageComponent } from '../admin-page/admin-page.component';
import { ReceptionistPageComponent } from '../receptionist-page/receptionist-page.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [AdminPageComponent,ReceptionistPageComponent,ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit {
constructor(private loginServcie:LoginService, private router:Router, private route: ActivatedRoute) {}

loginForm!:FormGroup;
userToken!:string;
userRole!:string;
loginError!:string;

// get the login form
get f() {
    return this.loginForm.controls;
  }


// important booleans

isAdmin:boolean=false;
isReceptionist:boolean=false;
sessionMessage:string | null = null;

navigateToSignUp():void{
  this.router.navigate(['/signup']);
}
ngOnInit(): void {

  this.loginForm= new FormGroup({
    email:new FormControl<string|null>(null,{validators:[Validators.required,Validators.email],updateOn:"change"}),
    password:new FormControl<string|null>(null,{validators:[Validators.required,Validators.minLength(3)],updateOn:"change"})
  })

  this.route.queryParams.subscribe(params => {
  if (params['sessionExpired'] === 'true') {
    this.sessionMessage = 'Your session has expired. Please log in again.';
  }
});
}

validateUser():void{
  this.loginServcie.getLoginResponse(this.loginForm.value.email,this.loginForm.value.password).subscribe({
    next: (res) => {
      try {
        if (res?.token) {
          sessionStorage.setItem('access_token', res.token);
        }
        if (res?.role){
          sessionStorage.setItem('role', res.role);
        } 
        if (res?.role === 'Admin') {
          this.router.navigate(['/admin']);
        } else if (res?.role === 'Receptionist') {
          this.router.navigate(['/receptionist']);
        }
      } catch (_) {}

      this.userToken=res.token;
      this.loginError=res.error;
      this.userRole=res.role;
    },
    error: (err) => {
    const errorMsg = err?.error?.message || 'Login failed. Please try again.';
    alert(errorMsg);
    this.router.navigate(['/login']);
  }
  }



)


}

}
