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
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';

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
    identifier: ['', [Validators.required, Validators.minLength(3)]],
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
  ) {
    // Registrar íconos
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    if (this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/app/dashboard', { replaceUrl: true });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

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
