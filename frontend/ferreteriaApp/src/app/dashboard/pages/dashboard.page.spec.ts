import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { DashboardPage } from './dashboard.page';
import { DashboardApiService } from '../services/dashboard-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let mockDashboardApi: jasmine.SpyObj<DashboardApiService>;
  let mockAuthSession: jasmine.SpyObj<AuthSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockData = {
    kpis: {
      ventasDia: 100,
      ordenesDia: 5,
      productosTotales: 50,
      productosStockBajo: 3,
    },
    salesLast7Days: [{ date: '2026-01-01', total: 20 }],
    topProducts: [{ name: 'Producto A', quantity: 10 }],
    recentActivity: [],
    lowStockAlerts: [],
  };

  beforeEach(waitForAsync(() => {
    mockDashboardApi = jasmine.createSpyObj('DashboardApiService', [
      'getDashboard',
    ]);
    mockDashboardApi.getDashboard.and.returnValue(of(mockData));
    mockAuthSession = jasmine.createSpyObj('AuthSessionService', [
      'getCurrentUser',
    ]);
    mockAuthSession.getCurrentUser.and.returnValue({ fullName: 'Admin' });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HttpClientTestingModule, DashboardPage],
      providers: [
        { provide: DashboardApiService, useValue: mockDashboardApi },
        { provide: AuthSessionService, useValue: mockAuthSession },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard on init', () => {
    spyOn(component, 'cargarDashboard').and.callThrough();
    component.ngOnInit();
    expect(component.cargarDashboard).toHaveBeenCalled();
    expect(component.dashboardData).toEqual(mockData);
  });

  it('should update charts when data loads', () => {
    component.dashboardData = mockData;
    component.actualizarGraficos();
    expect(component.lineChartData).toBeDefined();
    expect(component.barChartData).toBeDefined();
    expect(component.doughnutChartData).toBeDefined();
  });

  it('should handle error loading dashboard', async () => {
    mockDashboardApi.getDashboard.and.returnValue(
      throwError(() => new Error('Error')),
    );
    await component.cargarDashboard();
    expect(component.dashboardData).toBeNull();
  });

  it('should refresh data on refresh event', () => {
    const mockEvent = { target: { complete: jasmine.createSpy('complete') } };
    component.refresh(mockEvent);
    expect(mockDashboardApi.getDashboard).toHaveBeenCalled();
  });

  it('should navigate to module', () => {
    component.navigateTo('productos');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/productos']);
  });
});
