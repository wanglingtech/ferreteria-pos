// ============================================================
// PRUEBAS UNITARIAS - LOGIN PAGE
// ============================================================
// Objetivo: Verificar el comportamiento del componente LoginPage,
// incluyendo validaciones del formulario, llamadas al API,
// navegación y manejo de errores.
// ============================================================

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginPage } from './login.page';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  // Mocks (spies) de los servicios
  let mockAuthApi: jasmine.SpyObj<AuthApiService>;
  let mockAuthSession: jasmine.SpyObj<AuthSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(waitForAsync(() => {
    // Crear los spies con los métodos que vamos a usar
    mockAuthApi = jasmine.createSpyObj('AuthApiService', ['login']);
    mockAuthSession = jasmine.createSpyObj('AuthSessionService', [
      'saveSession',
      'isAuthenticated',
      'getToken',
      'getCurrentUser',
      'clearSession',
    ]);
    mockAuthSession.isAuthenticated.and.returnValue(false);

    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: () => null,
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        HttpClientTestingModule,
        LoginPage, // ✅ Componente standalone
      ],
      providers: [
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: AuthSessionService, useValue: mockAuthSession },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  // 1. Creación del componente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 2. Inicialización del formulario
  it('should initialize form with empty fields', () => {
    expect(component.form.get('identifier')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('remember')?.value).toBeFalse();
  });

  // 3. Validación del identificador
  it('should validate identifier as email or username', () => {
    const control = component.form.get('identifier');

    // Vacío → inválido
    control?.setValue('');
    expect(control?.invalid).toBeTrue();
    expect(control?.errors?.['required']).toBeTrue();

    // Email válido → válido
    control?.setValue('user@example.com');
    expect(control?.valid).toBeTrue();

    // Username válido → válido
    control?.setValue('valid_user');
    expect(control?.valid).toBeTrue();

    // Inválido → inválido
    control?.setValue('invalid!');
    expect(control?.invalid).toBeTrue();
    expect(control?.errors?.['identifierInvalid']).toBeDefined();
  });

  // 4. Validación de contraseña
  it('should validate password strength', () => {
    const control = component.form.get('password');

    // Débil → inválido
    control?.setValue('weak');
    expect(control?.invalid).toBeTrue();
    expect(control?.errors?.['passwordInvalid']).toContain('8 caracteres');

    // Fuerte → válido
    control?.setValue('StrongP@ss1');
    expect(control?.valid).toBeTrue();

    // Con espacios → inválido
    control?.setValue('Has Space1');
    expect(control?.invalid).toBeTrue();
    expect(control?.errors?.['passwordInvalid']).toContain('espacios');
  });

  // 5. Login exitoso
  it('should call login API and navigate on success', () => {
    const loginData = {
      tokenType: 'Bearer',
      accessToken: 'fake-token',
      expiresIn: '8h',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'SELLER' as const,
      },
    };
    mockAuthApi.login.and.returnValue(of(loginData));

    component.form.patchValue({
      identifier: 'testuser',
      password: 'StrongP@ss1',
    });
    component.submitLogin();

    expect(mockAuthApi.login).toHaveBeenCalledWith({
      identifier: 'testuser',
      password: 'StrongP@ss1',
    });
    expect(mockAuthSession.saveSession).toHaveBeenCalledWith(loginData);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/dashboard', {
      replaceUrl: true,
    });
  });

  // 6. Redirección con parámetro 'redirect'
  it('should navigate to redirect URL if provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(
      '/app/productos',
    );

    const loginData = {
      tokenType: 'Bearer',
      accessToken: 'fake-token',
      expiresIn: '8h',
      user: {
        id: 1,
        username: 'test',
        email: '',
        fullName: '',
        role: 'SELLER',
      },
    };
    mockAuthApi.login.and.returnValue(of(loginData));

    component.form.patchValue({
      identifier: 'test',
      password: 'StrongP@ss1',
    });
    component.submitLogin();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/productos', {
      replaceUrl: true,
    });
  });

  // 7. Error en login
  it('should show error on login failure', () => {
    const errorResponse = { error: { message: 'Credenciales inválidas' } };
    mockAuthApi.login.and.returnValue(throwError(() => errorResponse));

    component.form.patchValue({
      identifier: 'test',
      password: 'wrong',
    });
    component.submitLogin();

    expect(component.apiError).toBe('Credenciales inválidas');
    expect(mockAuthSession.saveSession).not.toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  // 8. Alternar visibilidad de contraseña
  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePassword();
    expect(component.showPassword).toBeTrue();
    component.togglePassword();
    expect(component.showPassword).toBeFalse();
  });

  // 9. No llamar al API si el formulario es inválido
  it('should not call login if form is invalid', () => {
    component.submitLogin();
    expect(mockAuthApi.login).not.toHaveBeenCalled();
  });

  // 10. Getter 'f' para acceder a controles
  it('should have getter f that returns form controls', () => {
    expect(component.f.identifier).toBe(component.form.get('identifier'));
    expect(component.f.password).toBe(component.form.get('password'));
  });

  // 11. Redirigir si ya hay sesión activa
  it('should redirect to dashboard if already authenticated', () => {
    mockAuthSession.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/dashboard', {
      replaceUrl: true,
    });
  });
});
