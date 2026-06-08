import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LoginPage } from './login.page';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockAuthApi: jasmine.SpyObj<AuthApiService>;
  let mockAuthSession: jasmine.SpyObj<AuthSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockAuthApi = jasmine.createSpyObj('AuthApiService', ['login']);
    mockAuthSession = jasmine.createSpyObj('AuthSessionService', [
      'saveSession',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: AuthSessionService, useValue: mockAuthSession },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('username')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  it('should validate email format', () => {
    const usernameControl = component.loginForm.get('username');
    usernameControl?.setValue('invalid');
    expect(usernameControl?.invalid).toBe(true);
  });

  it('should validate password length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');
    expect(passwordControl?.invalid).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.loginForm.patchValue({
      username: 'usuario@example.com',
      password: 'password123',
    });

    expect(component.loginForm.valid).toBe(true);
  });

  it('should call login API with credentials', async () => {
    const mockResponse = {
      token: 'mock-token',
      user: { id: 1, username: 'test', role: 'ADMIN' },
    };

    mockAuthApi.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      username: 'test',
      password: 'password123',
    });

    await component.login?.();

    expect(mockAuthApi.login).toHaveBeenCalled();
  });

  it('should save session on successful login', async () => {
    const mockResponse = {
      token: 'mock-token',
      user: { id: 1, username: 'test', role: 'ADMIN' },
    };

    mockAuthApi.login.and.returnValue(of(mockResponse));
    mockAuthSession.saveSession.and.returnValue(undefined);

    component.loginForm.patchValue({
      username: 'test',
      password: 'password123',
    });

    await component.login?.();

    expect(mockAuthSession.saveSession).toHaveBeenCalled();
  });

  it('should navigate to dashboard on successful login', async () => {
    const mockResponse = {
      token: 'mock-token',
      user: { id: 1, username: 'test', role: 'ADMIN' },
    };

    mockAuthApi.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      username: 'test',
      password: 'password123',
    });

    await component.login?.();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/dashboard'], {
      replaceUrl: true,
    });
  });

  it('should show error message on login failure', async () => {
    mockAuthApi.login.and.returnValue(
      throwError(() => new Error('Login failed')),
    );

    component.loginForm.patchValue({
      username: 'test',
      password: 'wrong',
    });

    await component.login?.();

    expect(component.errorMessage).toBeDefined();
  });

  it('should display login form', () => {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form');
    expect(form).toBeTruthy();
  });

  it('should have username input field', () => {
    fixture.detectChanges();
    const usernameInput = fixture.nativeElement.querySelector(
      'input[formControlName="username"]',
    );
    expect(usernameInput).toBeTruthy();
  });

  it('should have password input field', () => {
    fixture.detectChanges();
    const passwordInput = fixture.nativeElement.querySelector(
      'input[formControlName="password"]',
    );
    expect(passwordInput).toBeTruthy();
  });

  it('should have login button', () => {
    fixture.detectChanges();
    const loginBtn = fixture.nativeElement.querySelector(
      'ion-button[type="submit"]',
    );
    expect(loginBtn).toBeTruthy();
  });

  it('should disable login button when form is invalid', () => {
    fixture.detectChanges();
    const loginBtn = fixture.nativeElement.querySelector(
      'ion-button[type="submit"]',
    );
    expect(loginBtn?.disabled).toBe(true);
  });

  it('should show loading state during login', async () => {
    mockAuthApi.login.and.returnValue(of({ token: 'test', user: {} }));

    component.loginForm.patchValue({
      username: 'test',
      password: 'password123',
    });

    component.login?.();
    expect(component.loading).toBe(true);
  });
});
