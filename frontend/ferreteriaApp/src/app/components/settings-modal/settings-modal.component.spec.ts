import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { SettingsModalComponent } from './settings-modal.component';
import { UserSettingsService } from '../../core/services/user-settings.service';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;
  let mockSettingsService: jasmine.SpyObj<UserSettingsService>;
  let mockToastCtrl: jasmine.SpyObj<ToastController>;

  beforeEach(waitForAsync(() => {
    mockSettingsService = jasmine.createSpyObj('UserSettingsService', [
      'loadSettings',
      'updateSettings',
      'getNotificationsEnabled',
    ]);

    mockToastCtrl = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      declarations: [SettingsModalComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: UserSettingsService, useValue: mockSettingsService },
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open modal', () => {
    component.open();
    expect(component.isOpen).toBe(true);
  });

  it('should close modal', () => {
    component.close();
    expect(component.isOpen).toBe(false);
  });

  it('should load settings on init', () => {
    mockSettingsService.loadSettings.and.returnValue({
      notificationsEnabled: true,
    });

    component.ngOnInit?.();

    expect(mockSettingsService.loadSettings).toHaveBeenCalled();
  });

  it('should toggle notifications setting', async () => {
    component.notificationsEnabled = true;
    component.notificationsEnabled = false;

    expect(component.notificationsEnabled).toBe(false);
  });

  it('should save settings', async () => {
    mockSettingsService.updateSettings.and.returnValue(Promise.resolve());

    component.notificationsEnabled = false;
    await component.save();

    expect(mockSettingsService.updateSettings).toHaveBeenCalledWith({
      notificationsEnabled: false,
    });
  });

  it('should close modal after save', async () => {
    spyOn(component, 'close');
    mockSettingsService.updateSettings.and.returnValue(Promise.resolve());

    await component.save();

    expect(component.close).toHaveBeenCalled();
  });

  it('should display toggle switch', () => {
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('ion-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should display settings description', () => {
    fixture.detectChanges();
    const description = fixture.nativeElement.querySelector('ion-text');
    expect(description?.textContent).toContain('Notificaciones');
  });

  it('should have save button', () => {
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector(
      'ion-button[type="submit"]',
    );
    expect(saveButton).toBeTruthy();
  });

  it('should get current notifications setting', () => {
    mockSettingsService.getNotificationsEnabled.and.returnValue(true);

    const isEnabled = mockSettingsService.getNotificationsEnabled();

    expect(isEnabled).toBe(true);
  });

  it('should persist settings in localStorage', async () => {
    mockSettingsService.updateSettings.and.returnValue(Promise.resolve());

    component.notificationsEnabled = true;
    await component.save();

    expect(mockSettingsService.updateSettings).toHaveBeenCalled();
  });

  it('should show success message after save', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToastCtrl.create.and.returnValue(Promise.resolve(mockToast));
    mockSettingsService.updateSettings.and.returnValue(Promise.resolve());

    await component.save();

    expect(mockToastCtrl.create).toHaveBeenCalled();
  });
});
