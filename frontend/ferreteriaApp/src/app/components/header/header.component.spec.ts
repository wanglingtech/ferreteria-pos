import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, IonPopover } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HeaderComponent } from './header.component';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationsModalComponent } from '../notifications-modal/notifications-modal.component';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthSessionService>;
  let mockAlertCtrl: jasmine.SpyObj<AlertController>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('AuthSessionService', [
      'clearSession',
      'getCurrentUser',
    ]);
    mockAlertCtrl = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      declarations: [
        HeaderComponent,
        NotificationsModalComponent,
        ProfileModalComponent,
        SettingsModalComponent,
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthSessionService, useValue: mockAuthService },
        { provide: AlertController, useValue: mockAlertCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and subtitle', () => {
    component.title = 'Dashboard';
    component.subtitle = 'Ferretería July';
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('h1');
    expect(titleElement.textContent).toContain('Dashboard');
  });

  it('should emit menuClick when onMenuClick is called', () => {
    spyOn(component.menuClick, 'emit');
    component.onMenuClick();
    expect(component.menuClick.emit).toHaveBeenCalled();
  });

  it('should calculate user initials correctly', () => {
    component.user = { fullName: 'Juan Pérez', role: 'ADMIN' };
    expect(component.userInitials).toBe('JP');
  });

  it('should handle single name for initials', () => {
    component.user = { fullName: 'Admin', role: 'ADMIN' };
    expect(component.userInitials).toBe('AD');
  });

  it('should return US for undefined user', () => {
    component.user = null;
    expect(component.userInitials).toBe('US');
  });

  it('should open notifications modal', () => {
    component.notificationsModal = jasmine.createSpyObj(
      'NotificationsModalComponent',
      ['open'],
    );
    component.onNotificationClick();
    expect(component.notificationsModal.open).toHaveBeenCalled();
  });

  it('should open profile modal and close user menu', async () => {
    component.profileModal = jasmine.createSpyObj('ProfileModalComponent', [
      'open',
    ]);
    component.userMenuPopover = jasmine.createSpyObj('IonPopover', ['dismiss']);

    await component.openProfile();

    expect(component.userMenuPopover.dismiss).toHaveBeenCalled();
    expect(component.profileModal.open).toHaveBeenCalled();
  });

  it('should open settings modal and close user menu', async () => {
    component.settingsModal = jasmine.createSpyObj('SettingsModalComponent', [
      'open',
    ]);
    component.userMenuPopover = jasmine.createSpyObj('IonPopover', ['dismiss']);

    await component.openSettings();

    expect(component.userMenuPopover.dismiss).toHaveBeenCalled();
    expect(component.settingsModal.open).toHaveBeenCalled();
  });

  it('should present user menu popover', async () => {
    component.userMenuPopover = jasmine.createSpyObj('IonPopover', ['present']);
    const mockEvent = new Event('click');

    await component.openUserMenu(mockEvent);

    expect(component.userMenuPopover.present).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle logout with confirmation', async () => {
    const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    mockAlertCtrl.create.and.returnValue(Promise.resolve(mockAlert));
    component.userMenuPopover = jasmine.createSpyObj('IonPopover', ['dismiss']);

    await component.logout();

    expect(component.userMenuPopover.dismiss).toHaveBeenCalled();
    expect(mockAlertCtrl.create).toHaveBeenCalled();
    expect(mockAlert.present).toHaveBeenCalled();
  });

  it('should display user chip when user is present', () => {
    component.user = {
      fullName: 'Juan Pérez',
      role: 'ADMIN',
      imageUrl: 'https://example.com/avatar.jpg',
    };
    fixture.detectChanges();

    const userChip = fixture.nativeElement.querySelector('.user-chip');
    expect(userChip).toBeTruthy();
  });

  it('should hide user chip when user is null', () => {
    component.user = null;
    fixture.detectChanges();

    const userChip = fixture.nativeElement.querySelector('.user-chip');
    expect(userChip).toBeFalsy();
  });

  it('should display notification dot', () => {
    fixture.detectChanges();
    const notificationDot =
      fixture.nativeElement.querySelector('.notification-dot');
    expect(notificationDot).toBeTruthy();
  });
});
