import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { DashboardPage } from './dashboard.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    spyOn(component, 'cargarDatos');
    component.ngOnInit?.();
    expect(component.cargarDatos).toHaveBeenCalled();
  });

  it('should handle refresh event', async () => {
    spyOn(component, 'cargarDatos');

    const refresher = jasmine.createSpyObj('RefresherCustomEvent', ['detail']);
    refresher.detail = { complete: jasmine.createSpy('complete') };

    await component.onRefresh?.(refresher as any);

    expect(component.cargarDatos).toHaveBeenCalled();
    expect(refresher.detail.complete).toHaveBeenCalled();
  });

  it('should display dashboard title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h1');
    expect(title).toBeTruthy();
  });

  it('should have loading indicator', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ion-spinner')).toBeTruthy();
  });

  it('should display statistics cards', () => {
    component.estadisticas = {
      totalProductos: 10,
      productosActivos: 8,
      bajosStock: 2,
      totalVentas: 100,
      totalUsuarios: 5,
      ventasHoy: 25,
    };
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('ion-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should handle error loading data', async () => {
    spyOn(console, 'error');
    component.cargarDatos?.();
    expect(component.loading).toBeDefined();
  });
});
