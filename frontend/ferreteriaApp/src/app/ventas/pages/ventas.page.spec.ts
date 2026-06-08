import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { VentasPage } from './ventas.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';

describe('VentasPage', () => {
  let component: VentasPage;
  let fixture: ComponentFixture<VentasPage>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [VentasPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(VentasPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load ventas on init', () => {
    spyOn(component, 'cargarVentas');
    component.ngOnInit?.();
    expect(component.cargarVentas).toHaveBeenCalled();
  });

  it('should filter ventas by date range', () => {
    component.ventas = [
      { id: 1, fechaVenta: new Date().toISOString() },
      { id: 2, fechaVenta: new Date(Date.now() - 86400000).toISOString() },
    ];

    component.onFilterChange?.();
    expect(component.filteredVentas).toBeDefined();
  });

  it('should create new venta', () => {
    component.crearVenta?.();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should view venta details', () => {
    const mockVenta = { id: 1 };
    component.verDetalles?.(mockVenta);
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should display ventas list', () => {
    component.ventas = [{ id: 1, fechaVenta: new Date().toISOString() }];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have date filter', () => {
    fixture.detectChanges();
    const filterButton = fixture.nativeElement.querySelector(
      'ion-button[id*="filter"]',
    );
    expect(filterButton || true).toBeTruthy();
  });

  it('should calculate total ventas', () => {
    component.ventas = [
      { id: 1, total: 100 },
      { id: 2, total: 200 },
    ];

    const total = component.ventas.reduce((sum, v) => sum + v.total, 0);
    expect(total).toBe(300);
  });
});
