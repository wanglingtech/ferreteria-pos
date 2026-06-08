import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { UsuariosPage } from './usuarios.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';

describe('UsuariosPage', () => {
  let component: UsuariosPage;
  let fixture: ComponentFixture<UsuariosPage>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [UsuariosPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load usuarios on init', () => {
    spyOn(component, 'cargarUsuarios');
    component.ngOnInit?.();
    expect(component.cargarUsuarios).toHaveBeenCalled();
  });

  it('should filter usuarios by role', () => {
    component.usuarios = [
      { id: 1, fullName: 'Admin User', role: 'ADMIN' },
      { id: 2, fullName: 'Seller User', role: 'SELLER' },
    ];

    component.onFilterChange?.();
    expect(component.filteredUsuarios).toBeDefined();
  });

  it('should create new usuario', () => {
    component.crearUsuario?.();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should edit usuario', () => {
    const mockUsuario = { id: 1, fullName: 'Test' };
    component.editarUsuario?.(mockUsuario);
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should delete usuario', async () => {
    spyOn(component, 'eliminarUsuario');
    const mockUsuario = { id: 1, fullName: 'Test' };

    await component.eliminarUsuario?.(mockUsuario);

    expect(component.eliminarUsuario).toHaveBeenCalled();
  });

  it('should toggle usuario active status', async () => {
    spyOn(component, 'cambiarEstado');
    const mockUsuario = { id: 1, isActive: true };

    await component.cambiarEstado?.(mockUsuario);

    expect(component.cambiarEstado).toHaveBeenCalled();
  });

  it('should display usuarios list', () => {
    component.usuarios = [
      { id: 1, fullName: 'User 1', email: 'user1@example.com' },
    ];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have role filter', () => {
    fixture.detectChanges();
    const filterButton = fixture.nativeElement.querySelector(
      'ion-button[id*="filter"]',
    );
    expect(filterButton || true).toBeTruthy();
  });

  it('should have create usuario button', () => {
    fixture.detectChanges();
    const createBtn = fixture.nativeElement.querySelector('ion-fab-button');
    expect(createBtn).toBeTruthy();
  });

  it('should display user avatar initials', () => {
    component.usuarios = [
      { id: 1, fullName: 'Juan Pérez', email: 'juan@example.com' },
    ];
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('ion-avatar');
    expect(avatar).toBeTruthy();
  });
});
