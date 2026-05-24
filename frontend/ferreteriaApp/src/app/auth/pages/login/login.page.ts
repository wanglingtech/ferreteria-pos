import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTitle,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonTitle,
    IonText,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class LoginPage implements OnInit {
  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submitting = false;
  protected apiError = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly authSession: AuthSessionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }

  protected submitLogin(): void {
    this.apiError = '';
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;

    this.authApi
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        },
        error: (error) => {
          this.apiError = error?.error?.message || 'No se pudo iniciar sesión.';
        },
      });
  }
}
