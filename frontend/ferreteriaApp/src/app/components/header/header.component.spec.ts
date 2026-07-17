// Este archivo ha sido ajustado para probar correctamente HeaderComponent según su implementación real.
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { Router, provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { NotificationsModalComponent } from '../notifications-modal/notifications-modal.component';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthSessionService>;
  let mockAlertCtrl: jasmine.SpyObj<AlertController>;

  let mockNotificationsModal: jasmine.SpyObj<NotificationsModalComponent>;
  let mockProfileModal: jasmine.SpyObj<ProfileModalComponent>;
  let mockSettingsModal: jasmine.SpyObj<SettingsModalComponent>;
  let mockUserMenuPopover: jasmine.SpyObj<any>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('AuthSessionService', ['clearSession']);
    mockAlertCtrl = jasmine.createSpyObj('AlertController', ['create']);

    mockNotificationsModal = jasmine.createSpyObj('NotificationsModalComponent', ['open']);
    mockProfileModal = jasmine.createSpyObj('ProfileModalComponent', ['open']);
    mockSettingsModal = jasmine.createSpyObj('SettingsModalComponent', ['open']);
    mockUserMenuPopover = jasmine.createSpyObj('IonPopover', ['present', 'dismiss']);

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: mockAuthService },
        { provide: AlertController, useValue: mockAlertCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;

    component.notificationsModal = mockNotificationsModal as any;
    component.profileModal = mockProfileModal as any;
    component.settingsModal = mockSettingsModal as any;
    component.userMenuPopover = mockUserMenuPopover as any;
  }));

  it('debe crear el componente HeaderComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe tener valores por defecto para title y subtitle', () => {
    expect(component.title).toBe('Dashboard');
    expect(component.subtitle).toBe('Ferretería July');
  });

  it('debe calcular correctamente las iniciales del usuario', () => {
    component.user = { fullName: 'Juan Pérez', role: 'ADMIN' };
    expect(component.userInitials).toBe('JP');

    component.user = { fullName: 'Admin', role: 'ADMIN' };
    expect(component.userInitials).toBe('AD');

    component.user = null;
    expect(component.userInitials).toBe('US');
  });

  it('debe traducir correctamente el rol del usuario', () => {
    component.user = { fullName: 'Juan Pérez', role: 'ADMIN' };
    expect(component.userRoleLabel).toBe('Administrador');

    component.user = { fullName: 'Juan Pérez', role: 'SELLER' };
    expect(component.userRoleLabel).toBe('Vendedor');
  });

  it('debe abrir el modal de notificaciones', () => {
    component.onNotificationClick();
    expect(mockNotificationsModal.open).toHaveBeenCalled();
  });

  it('debe abrir el modal de perfil', () => {
    component.openProfile();
    expect(mockProfileModal.open).toHaveBeenCalled();
  });

  it('debe abrir el modal de configuración', () => {
    component.openSettings();
    expect(mockSettingsModal.open).toHaveBeenCalled();
  });
});
  });

  it('should return "Vendedor" for SELLER role', () => {
    component.user = { fullName: 'Vendedor', role: 'SELLER' };
    expect(component.userRoleLabel).toBe('Vendedor');
  });

  it('should emit menuClick when onMenuClick is called', () => {
    spyOn(component.menuClick, 'emit');
    component.onMenuClick();
    expect(component.menuClick.emit).toHaveBeenCalled();
  });

  it('should open notifications modal', () => {
    component.onNotificationClick();
    expect(mockNotificationsModal.open).toHaveBeenCalled();
  });

  it('should open profile modal and close user menu', async () => {
    await component.openProfile();
    expect(mockUserMenuPopover.dismiss).toHaveBeenCalled();
    expect(mockProfileModal.open).toHaveBeenCalled();
  });

  it('should open settings modal and close user menu', async () => {
    await component.openSettings();
    expect(mockUserMenuPopover.dismiss).toHaveBeenCalled();
    expect(mockSettingsModal.open).toHaveBeenCalled();
  });

  it('should present user menu popover on openUserMenu', async () => {
    const mockEvent = new Event('click');
    await component.openUserMenu(mockEvent);
    expect(mockUserMenuPopover.present).toHaveBeenCalledWith(mockEvent);
  });

  it('should close user menu on closeUserMenu', async () => {
    await component.closeUserMenu();
    expect(mockUserMenuPopover.dismiss).toHaveBeenCalled();
  });

  it('should handle logout with confirmation', async () => {
    const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    mockAlertCtrl.create.and.returnValue(Promise.resolve(mockAlert));
    mockAuthService.clearSession.and.callThrough();

    await component.logout();

    expect(mockUserMenuPopover.dismiss).toHaveBeenCalled();
    expect(mockAlertCtrl.create).toHaveBeenCalledWith({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir?',
      buttons: jasmine.any(Array),
    });
    expect(mockAlert.present).toHaveBeenCalled();

    const alertConfig = mockAlertCtrl.create.calls.mostRecent().args[0];
    const logoutButton = alertConfig.buttons.find(
      (btn: any) => btn.text === 'Salir',
    );
    expect(logoutButton).toBeDefined();
    logoutButton.handler();

    expect(mockAuthService.clearSession).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
      replaceUrl: true,
    });
  });

  it('should not navigate if logout is cancelled', async () => {
    const mockAlert = jasmine.createSpyObj('HTMLIonAlertElement', ['present']);
    mockAlertCtrl.create.and.returnValue(Promise.resolve(mockAlert));

    await component.logout();

    const alertConfig = mockAlertCtrl.create.calls.mostRecent().args[0];
    const cancelButton = alertConfig.buttons.find(
      (btn: any) => btn.text === 'Cancelar',
    );
    expect(cancelButton).toBeDefined();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should display user chip when user is provided', () => {
    component.user = {
      fullName: 'Juan Pérez',
      role: 'ADMIN',
      imageUrl: 'https://example.com/avatar.jpg',
    };
    fixture.detectChanges();

    const userChip = debugElement.query(By.css('.user-chip'));
    expect(userChip).toBeTruthy();

    const userName = debugElement.query(By.css('.user-name'));
    const userRole = debugElement.query(By.css('.user-role'));
    expect(userName.nativeElement.textContent).toContain('Juan Pérez');
    expect(userRole.nativeElement.textContent).toContain('Administrador');
  });

  it('should hide user chip when user is null', () => {
    component.user = null;
    fixture.detectChanges();

    const userChip = debugElement.query(By.css('.user-chip'));
    expect(userChip).toBeFalsy();
  });

  it('should show avatar image if imageUrl is provided', () => {
    component.user = {
      fullName: 'Juan Pérez',
      role: 'ADMIN',
      imageUrl: 'https://example.com/avatar.jpg',
    };
    fixture.detectChanges();

    const avatarImg = debugElement.query(By.css('.user-avatar img'));
    expect(avatarImg).toBeTruthy();
    expect(avatarImg.nativeElement.src).toContain('avatar.jpg');
  });

  it('should show initials in avatar if imageUrl is not provided', () => {
    component.user = {
      fullName: 'Juan Pérez',
      role: 'ADMIN',
    };
    fixture.detectChanges();

    const avatarSpan = debugElement.query(By.css('.user-avatar span'));
    expect(avatarSpan).toBeTruthy();
    expect(avatarSpan.nativeElement.textContent).toBe('JP');
  });

  it('should display notification dot', () => {
    const dot = debugElement.query(By.css('.notification-dot'));
    expect(dot).toBeTruthy();
  });

  it('should emit menuClick when menu button is clicked', () => {
    spyOn(component.menuClick, 'emit');
    const menuBtn = debugElement.query(By.css('.menu-btn'));
    expect(menuBtn).toBeTruthy();
    menuBtn.nativeElement.click();
    expect(component.menuClick.emit).toHaveBeenCalled();
  });

  it('should open notifications modal when notification button is clicked', () => {
    const notifBtn = debugElement.query(By.css('.notification-btn'));
    expect(notifBtn).toBeTruthy();
    notifBtn.nativeElement.click();
    expect(mockNotificationsModal.open).toHaveBeenCalled();
  });

  it('should open user menu popover when user chip is clicked', async () => {
    component.user = { fullName: 'Test', role: 'ADMIN' };
    fixture.detectChanges();

    const userChip = debugElement.query(By.css('.user-chip'));
    expect(userChip).toBeTruthy();

    const event = new Event('click');
    spyOn(component, 'openUserMenu').and.callThrough();
    userChip.nativeElement.click();
    expect(component.openUserMenu).toHaveBeenCalledWith(event);
  });

  it('should close user menu when closeUserMenu is called', async () => {
    await component.closeUserMenu();
    expect(mockUserMenuPopover.dismiss).toHaveBeenCalled();
  });

  it('should have child components instantiated', () => {
    expect(component.notificationsModal).toBeDefined();
    expect(component.profileModal).toBeDefined();
    expect(component.settingsModal).toBeDefined();
    expect(component.userMenuPopover).toBeDefined();
  });
});
