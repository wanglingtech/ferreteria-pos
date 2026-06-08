import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthSessionService } from '../core/services/auth-session.service';
import { NotificationService } from '../core/services/notification.service';
import { HeaderComponent } from '../components/header/header.component';
import { SiderbarComponent } from '../components/siderbar/siderbar.component';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { of } from 'rxjs';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;
  let mockMenuCtrl: jasmine.SpyObj<MenuController>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthSessionService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(waitForAsync(() => {
    mockMenuCtrl = jasmine.createSpyObj('MenuController', ['open', 'close']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(new NavigationEnd(1, '/app/dashboard', '/app/dashboard')),
    });
    mockAuthService = jasmine.createSpyObj(
      'AuthSessionService',
      ['getCurrentUser'],
      {
        currentUser$: of(null),
      },
    );
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'cargarNotificaciones',
    ]);
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      firstChild: null,
      snapshot: { data: { title: 'Dashboard', subtitle: 'Ferretería July' } },
    });

    TestBed.configureTestingModule({
      declarations: [
        AppShellComponent,
        HeaderComponent,
        SiderbarComponent,
        BottomNavComponent,
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: MenuController, useValue: mockMenuCtrl },
        { provide: Router, useValue: mockRouter },
        { provide: AuthSessionService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default title', () => {
    expect(component['pageTitle']).toBe('Dashboard');
    expect(component['pageSubtitle']).toBe('Ferretería July');
  });

  it('should open menu', async () => {
    mockMenuCtrl.open.and.returnValue(Promise.resolve(true));

    await component['openMenu']();

    expect(mockMenuCtrl.open).toHaveBeenCalledWith('main-menu');
  });

  it('should close menu', async () => {
    mockMenuCtrl.close.and.returnValue(Promise.resolve(true));

    await component['closeMenu']();

    expect(mockMenuCtrl.close).toHaveBeenCalled();
  });

  it('should load notifications on init', () => {
    component.ngOnInit();

    expect(mockNotificationService.cargarNotificaciones).toHaveBeenCalled();
  });

  it('should update user when auth service emits', () => {
    const mockUser = {
      id: 1,
      username: 'juan',
      email: 'juan@example.com',
      fullName: 'Juan Pérez',
      role: 'ADMIN',
      imageUrl: 'https://example.com/avatar.jpg',
    };

    const authService = TestBed.inject(
      AuthSessionService,
    ) as jasmine.SpyObj<AuthSessionService>;
    Object.defineProperty(authService, 'currentUser$', {
      value: of(mockUser),
    });

    component.ngOnInit();

    expect(component['user']).toBeDefined();
  });

  it('should render header component', () => {
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('app-header');
    expect(header).toBeTruthy();
  });

  it('should render sidebar component', () => {
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('ion-menu');
    expect(sidebar).toBeTruthy();
  });

  it('should render bottom navigation component', () => {
    fixture.detectChanges();
    const bottomNav = fixture.nativeElement.querySelector('app-bottom-nav');
    expect(bottomNav).toBeTruthy();
  });

  it('should have router outlet for child pages', () => {
    fixture.detectChanges();
    const routerOutlet =
      fixture.nativeElement.querySelector('ion-router-outlet');
    expect(routerOutlet).toBeTruthy();
  });
});
