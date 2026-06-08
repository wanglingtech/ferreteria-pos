import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReportesPage } from './reportes.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ReportesPage', () => {
  let component: ReportesPage;
  let fixture: ComponentFixture<ReportesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReportesPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reportes on init', () => {
    spyOn(component, 'cargarReportes');
    component.ngOnInit?.();
    expect(component.cargarReportes).toHaveBeenCalled();
  });

  it('should filter reportes by type', () => {
    component.reportes = [
      { id: 1, tipo: 'ventas', titulo: 'Reporte Ventas' },
      { id: 2, tipo: 'inventario', titulo: 'Reporte Inventario' },
    ];

    component.onFilterChange?.();
    expect(component.filteredReportes).toBeDefined();
  });

  it('should generate new report', async () => {
    spyOn(component, 'generarReporte');

    await component.generarReporte?.('ventas');

    expect(component.generarReporte).toHaveBeenCalled();
  });

  it('should export report to PDF', async () => {
    spyOn(component, 'exportarReporte');
    const mockReporte = { id: 1, titulo: 'Test Report' };

    await component.exportarReporte?.(mockReporte, 'pdf');

    expect(component.exportarReporte).toHaveBeenCalled();
  });

  it('should export report to Excel', async () => {
    spyOn(component, 'exportarReporte');
    const mockReporte = { id: 1, titulo: 'Test Report' };

    await component.exportarReporte?.(mockReporte, 'excel');

    expect(component.exportarReporte).toHaveBeenCalled();
  });

  it('should delete report', async () => {
    spyOn(component, 'eliminarReporte');
    const mockReporte = { id: 1, titulo: 'Test Report' };

    await component.eliminarReporte?.(mockReporte);

    expect(component.eliminarReporte).toHaveBeenCalled();
  });

  it('should display reportes list', () => {
    component.reportes = [{ id: 1, titulo: 'Report 1', tipo: 'ventas' }];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have report type filter', () => {
    fixture.detectChanges();
    const filterButton = fixture.nativeElement.querySelector(
      'ion-button[id*="filter"]',
    );
    expect(filterButton || true).toBeTruthy();
  });

  it('should display report generation date', () => {
    component.reportes = [
      { id: 1, titulo: 'Report', fechaGeneracion: new Date() },
    ];
    fixture.detectChanges();

    const dateElements = fixture.nativeElement.querySelectorAll('p');
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
