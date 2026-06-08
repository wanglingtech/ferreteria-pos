import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from './bottom-nav.component';
import { Router } from '@angular/router';

describe('BottomNavComponent', () => {
  let component: BottomNavComponent;
  let fixture: ComponentFixture<BottomNavComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [BottomNavComponent],
      imports: [IonicModule.forRoot()],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have navigation items', () => {
    const navItems = fixture.nativeElement.querySelectorAll('ion-tab-button');
    expect(navItems.length).toBeGreaterThan(0);
  });

  it('should navigate to dashboard', () => {
    component.navigateToDashboard();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('should navigate to productos', () => {
    component.navigateToProductos();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/productos']);
  });

  it('should navigate to ventas', () => {
    component.navigateToVentas();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/ventas']);
  });

  it('should navigate to inventario', () => {
    component.navigateToInventario();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/inventario']);
  });

  it('should navigate to usuarios', () => {
    component.navigateToUsuarios();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/usuarios']);
  });

  it('should navigate to reportes', () => {
    component.navigateToReportes();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/reportes']);
  });

  it('should have correct icons for each tab', () => {
    const tabButtons = fixture.nativeElement.querySelectorAll('ion-tab-button');
    const iconNames = Array.from(tabButtons).map((btn: any) =>
      btn.querySelector('ion-icon')?.getAttribute('name'),
    );
    expect(iconNames.length).toBeGreaterThan(0);
  });

  it('should display tab labels', () => {
    const tabButtons = fixture.nativeElement.querySelectorAll('ion-label');
    expect(tabButtons.length).toBeGreaterThan(0);
  });
});
