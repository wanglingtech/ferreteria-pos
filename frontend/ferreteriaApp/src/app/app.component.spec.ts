import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
// Este archivo ha sido ajustado para probar correctamente AppComponent con sus dependencias.
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd, Event } from '@angular/router';
import { AppComponent } from './app.component';
import { HttpErrorService } from './core/services/http-error.service';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpErrorServiceMock: jasmine.SpyObj<HttpErrorService>;
  let errorMessageSubject: Subject<string>;
  let routerEventsSubject: Subject<Event>;
  let routerMock: any;

  beforeEach(async () => {
    errorMessageSubject = new Subject<string>();
    routerEventsSubject = new Subject<Event>();

    httpErrorServiceMock = jasmine.createSpyObj('HttpErrorService', [], {
      errorMessage$: errorMessageSubject.asObservable(),
    });

    routerMock = {
      events: routerEventsSubject.asObservable(),
      url: '/dashboard',
      navigate: jasmine.createSpy('navigate'),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: HttpErrorService, useValue: httpErrorServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('debe crear la aplicación', () => {
    expect(component).toBeTruthy();
  });

  it('debe suscribirse a los mensajes de error de HttpErrorService y abrir el toast', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit
    errorMessageSubject.next('Error de conexión');
    expect((component as any).toastMessage).toBe('Error de conexión');
    expect((component as any).toastOpen).toBeTrue();
  });

  it('debe detectar si la ruta actual es la página de login', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit
    routerMock.url = '/auth/login';
    routerEventsSubject.next(
      new NavigationEnd(1, '/auth/login', '/auth/login'),
    );
    expect((component as any).isLoginPage).toBeTrue();
  });

  it('debe cerrar el toast al llamar a onToastDismiss', () => {
    fixture.detectChanges();
    (component as any).toastOpen = true;
    (component as any).onToastDismiss();
    expect((component as any).toastOpen).toBeFalse();
  });
});
