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
        this.identifierValidator, // ✅ validador personalizado
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        this.passwordValidator, // ✅ validador personalizado (evita espacios)
      ],
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

  // ============================================================
  // VALIDADORES PERSONALIZADOS
  // ============================================================

  /**
   * Valida que el identifier sea email válido O username válido.
   * Usa regex para evitar caracteres extraños.
   */
  private identifierValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;

    // Validar como email (formato básico)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(value)) return null;

    // Validar como username (solo letras, números, guiones, puntos, guion bajo)
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (usernameRegex.test(value)) return null;

    return {
      identifierInvalid:
        'Ingresa un email válido o un nombre de usuario (solo letras, números, guiones, puntos, guion bajo). Sin espacios.',
    };
  }

  /**
   * Valida que la contraseña no contenga espacios y tenga al menos 6 caracteres.
   */
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (value.includes(' ')) {
      return { passwordInvalid: 'La contraseña no puede contener espacios.' };
    }
    return null;
  }

  // ============================================================
  // GETTERS
  // ============================================================
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
