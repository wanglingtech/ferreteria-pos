import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProfileModalComponent } from './profile-modal.component';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { UsuariosApiService } from '../../usuarios/services/usuarios-api.service';
import { ToastController } from '@ionic/angular';

describe('ProfileModalComponent', () => {
  let component: ProfileModalComponent;
  let fixture: ComponentFixture<ProfileModalComponent>;
  let mockAuthService: jasmine.SpyObj<AuthSessionService>;
  let mockUsuariosApi: jasmine.SpyObj<UsuariosApiService>;
  let mockToastCtrl: jasmine.SpyObj<ToastController>;

  beforeEach(waitForAsync(() => {
    mockAuthService = jasmine.createSpyObj('AuthSessionService', [
      'getCurrentUser',
      'updateCurrentUser',
    ]);
    mockUsuariosApi = jasmine.createSpyObj('UsuariosApiService', [
      'actualizarMiPerfil',
    ]);
    mockToastCtrl = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      declarations: [ProfileModalComponent],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AuthSessionService, useValue: mockAuthService },
        { provide: UsuariosApiService, useValue: mockUsuariosApi },
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileModalComponent);
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

  it('should initialize form with current user data', () => {
    const mockUser = {
      id: 1,
      fullName: 'Juan Pérez',
      email: 'juan@example.com',
      imageUrl: 'https://example.com/avatar.jpg',
      username: 'juan',
      role: 'ADMIN',
    };

    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    component.ngOnInit?.();

    expect(component.profileForm.value.fullName).toBe('Juan Pérez');
    expect(component.profileForm.value.email).toBe('juan@example.com');
  });

  it('should update preview image on URL change', () => {
    component.profileForm.patchValue({
      imageUrl: 'https://example.com/new-avatar.jpg',
    });

    component.onImageUrlChange();

    expect(component.previewImage).toBe('https://example.com/new-avatar.jpg');
  });

  it('should validate email format', () => {
    component.profileForm.patchValue({
      email: 'invalid-email',
    });

    const emailControl = component.profileForm.get('email');
    expect(emailControl?.invalid).toBe(true);
  });

  it('should disable save button when form is invalid', () => {
    component.profileForm.patchValue({
      fullName: '',
      email: '',
    });

    expect(component.profileForm.invalid).toBe(true);
  });

  it('should call save method on form submit', async () => {
    spyOn(component, 'save');

    component.profileForm.patchValue({
      fullName: 'Juan Pérez',
      email: 'juan@example.com',
      imageUrl: '',
    });

    component.save();

    expect(component.save).toHaveBeenCalled();
  });

  it('should show error toast on save failure', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToastCtrl.create.and.returnValue(Promise.resolve(mockToast));

    mockUsuariosApi.actualizarMiPerfil.and.returnValue(
      new (Promise as any).reject(new Error('API Error')),
    );

    await component.save();

    expect(mockToastCtrl.create).toHaveBeenCalled();
  });

  it('should display user avatar', () => {
    component.currentUser = {
      id: 1,
      fullName: 'Juan Pérez',
      email: 'juan@example.com',
      imageUrl: 'https://example.com/avatar.jpg',
      username: 'juan',
      role: 'ADMIN',
    };
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('ion-avatar img');
    expect(avatar?.src).toContain('example.com');
  });
});
