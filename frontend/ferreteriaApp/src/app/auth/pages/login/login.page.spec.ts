import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginPage } from './login.page';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockAuthApi: jasmine.SpyObj<AuthApiService>;
  let mockAuthSession: jasmine.SpyObj<AuthSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(waitForAsync(() => {
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
    mockActivatedRoute = { snapshot: { queryParamMap: { get: () => null } } };

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        HttpClientTestingModule,
        LoginPage, // standalone
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('identifier')).toBeDefined();
    expect(component.form.get('password')).toBeDefined();
  });

  it('should validate identifier as email or username', () => {
    const control = component.form.get('identifier');
    control?.setValue('invalid!');
    expect(control?.invalid).toBeTrue();
    control?.setValue('validuser');
    expect(control?.valid).toBeTrue();
    control?.setValue('user@example.com');
    expect(control?.valid).toBeTrue();
  });

  it('should validate password strength', () => {
    const control = component.form.get('password');
    control?.setValue('weak');
    expect(control?.invalid).toBeTrue();
    control?.setValue('StrongP@ss1');
    expect(control?.valid).toBeTrue();
  });

  it('should call login API and navigate on success', () => {
    const loginData = {
      tokenType: 'Bearer',
      accessToken: 'token',
      expiresIn: '8h',
      user: {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        fullName: 'Test',
        role: 'SELLER',
      },
    };
    mockAuthApi.login.and.returnValue(of(loginData));
    component.form.patchValue({ identifier: 'test', password: 'StrongP@ss1' });
    component.submitLogin();
    expect(mockAuthApi.login).toHaveBeenCalled();
    expect(mockAuthSession.saveSession).toHaveBeenCalledWith(loginData);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/dashboard', {
      replaceUrl: true,
    });
  });

  it('should show error on login failure', () => {
    const error = { error: { message: 'Invalid credentials' } };
    mockAuthApi.login.and.returnValue(throwError(() => error));
    component.form.patchValue({ identifier: 'test', password: 'wrong' });
    component.submitLogin();
    expect(component.apiError).toBe('Invalid credentials');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePassword();
    expect(component.showPassword).toBeTrue();
  });
});
