import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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
    identifier: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        this.identifierValidator,
      ],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), this.passwordValidator],
    ],
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
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  // Valida identifier: email válido o username permitido (sin espacios)
  private identifierValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    // Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(value)) return null;
    // Username permitido
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (usernameRegex.test(value)) return null;
    return {
      identifierInvalid:
        'Ingresa un email válido o un nombre de usuario (solo letras, números, guiones, puntos, guion bajo). Sin espacios.',
    };
  }

  // Valida contraseña: min 8, mayúscula, minúscula, número, sin espacios
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (value.includes(' '))
      return { passwordInvalid: 'La contraseña no puede contener espacios.' };
    if (value.length < 8)
      return {
        passwordInvalid: 'La contraseña debe tener al menos 8 caracteres.',
      };
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    if (!hasUpper || !hasLower || !hasNumber) {
      return {
        passwordInvalid:
          'La contraseña debe tener al menos una mayúscula, una minúscula y un número.',
      };
    }
    return null;
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
          // Evitar navegar a la misma ruta
          const targetUrl = redirect || '/app/dashboard';
          if (this.router.url !== targetUrl) {
            void this.router.navigateByUrl(targetUrl, { replaceUrl: true });
          }
        },
        error: (err) => {
          this.apiError = err?.error?.message || 'Error al iniciar sesión';
        },
      });
  }
}
