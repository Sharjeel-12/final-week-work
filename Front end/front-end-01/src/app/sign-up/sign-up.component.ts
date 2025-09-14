import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SignUpService, SignUpBody } from '../Services/sign-up.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;

  constructor(private signUp: SignUpService, private router: Router) {}

  get f() { return this.signupForm.controls; }

  ngOnInit(): void {
    this.signupForm = new FormGroup({
      email: new FormControl<string>('', [Validators.required, Validators.email]),
      password: new FormControl<string | null>(null, [Validators.required, Validators.minLength(6)]), // enforce 6 chars
      role: new FormControl<string>('Admin') // optional now
    });
  }

  registerUser(): void {
const body = {
    email: this.signupForm.value.email,
    password: this.signupForm.value.password,
    role: this.signupForm.value.role
  };

  this.signUp.registerUser(body).subscribe({
    next: (res) => {
      alert(`You have successfully signed up${res?.role ? ' as ' + res.role : ''}.`);
      this.router.navigate(['/login']);
    },
    error: (err) => {
      if (err?.status === 409) {
        alert('An account with this email already exists. Please log in or use a different email.');
        return;
      }
      const msg =
        err?.error?.message ||
        err?.error?.title ||
        (err?.error?.errors ? JSON.stringify(err.error.errors) :
         (typeof err?.error === 'string' ? err.error : 'Unknown error'));
      alert(`Sign up failed: ${msg}`);
      console.error('Signup error:', err);
    }
  });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
