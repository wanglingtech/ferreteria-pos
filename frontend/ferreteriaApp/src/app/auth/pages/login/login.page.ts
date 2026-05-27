import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
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
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonSpinner,
    IonText,
    IonCheckbox,
    IonIcon,
  ],
})
export class LoginPage implements OnInit {
  // =========================
  // FORM
  // =========================
  protected form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],

    password: ['', [Validators.required, Validators.minLength(6)]],

    remember: [false],
  });

  // =========================
  // STATES
  // =========================
  protected submitting = false;

  protected apiError = '';

  protected showPassword = false;

  constructor(
    private fb: FormBuilder,

    private authApi: AuthApiService,

    private authSession: AuthSessionService,

    private router: Router,

    private route: ActivatedRoute,
  ) {}

  // =========================
  // FORM CONTROLS
  // =========================
  get f() {
    return this.form.controls;
  }

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    // si ya inició sesión
    if (this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/app/dashboard', {
        replaceUrl: true,
      });
    }
  }

  // =========================
  // SHOW / HIDE PASSWORD
  // =========================
  togglePassword(): void {
    this.showPassword = !this.showPassword;

    // animación icono
    const el = document.querySelector('.toggle-password');

    if (el) {
      el.classList.remove('active');

      // reinicia animación
      void (el as HTMLElement).offsetWidth;

      el.classList.add('active');
    }
  }

  // =========================
  // LOGIN
  // =========================
  submitLogin(): void {
    // limpia errores API
    this.apiError = '';

    // marca campos tocados
    this.form.markAllAsTouched();

    // evita submit inválido
    if (this.form.invalid || this.submitting) {
      return;
    }

    // loading
    this.submitting = true;

    // request
    this.authApi
      .login(this.form.getRawValue())

      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
      )

      .subscribe({
        // SUCCESS
        next: () => {
          const redirect = this.route.snapshot.queryParamMap.get('redirect');

          void this.router.navigateByUrl(redirect || '/app/dashboard', {
            replaceUrl: true,
          });
        },

        // ERROR
        error: (err) => {
          this.apiError = err?.error?.message || 'Error al iniciar sesión';
        },
      });
  }
}
