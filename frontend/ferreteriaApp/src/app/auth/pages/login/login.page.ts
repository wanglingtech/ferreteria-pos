import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonCheckbox,
  IonIcon,
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
  protected form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

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

  ngOnInit(): void {
    if (this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/app/dashboard', { replaceUrl: true });
    }
  }

  // =========================
  // TOGGLE PASSWORD + ANIMACIÓN OJO
  // =========================
  togglePassword(): void {
    this.showPassword = !this.showPassword;

    const el = document.querySelector('.toggle-password');

    if (el) {
      el.classList.remove('active');

      // fuerza reflow para reiniciar animación
      void (el as HTMLElement).offsetWidth;

      el.classList.add('active');
    }
  }

  // =========================
  // LOGIN
  // =========================
  submitLogin(): void {
    this.apiError = '';
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting) return;

    this.submitting = true;

    this.authApi
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          const redirect = this.route.snapshot.queryParamMap.get('redirect');

          void this.router.navigateByUrl(redirect || '/app/dashboard', {
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.apiError = err?.error?.message || 'Error al iniciar sesión';
        },
      });
  }
}
