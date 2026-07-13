// ============================================================
// DASHBOARD PAGE - VISTA PRINCIPAL CON KPIs, GRÁFICOS Y ALERTAS
// Los gráficos ahora son gestionados por ChartService para mantener el componente limpio.
// ============================================================

import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  AfterViewInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  cashOutline,
  receiptOutline,
  cubeOutline,
  alertCircleOutline,
  statsChartOutline,
  pieChartOutline,
  analyticsOutline,
  layersOutline,
  cartOutline,
  peopleOutline,
  barChartOutline,
  settingsOutline,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';

import { BaseChartDirective } from 'ng2-charts';
import { firstValueFrom, Subject, filter, takeUntil } from 'rxjs';

import { DashboardApiService } from '../services/dashboard-api.service';
import { DashboardData } from '../interfaces/dashboard.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';
// ✅ Importar el servicio de gráficos
import { ChartService } from '../../core/services/chart.service';

// NOTA: Ya no necesitamos importar Chart y registerables aquí, porque el servicio los maneja.

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    BaseChartDirective, // Aún usamos la directiva para renderizar, pero los datos los manejamos nosotros
  ],
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {
  // ============================================================
  // 1. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private authSession = inject(AuthSessionService);
  private dashboardApi = inject(DashboardApiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private chartService = inject(ChartService); // ✅ Servicio de gráficos

  // ============================================================
  // 2. ESTADO Y DATOS
  // ============================================================
  /** Usuario actual (para mostrar su nombre en el saludo) */
  get user() {
    return this.authSession.getCurrentUser();
  }

  /** Vista activa (Resumen, Analytics, Módulos) */
  activeView = 'overview';

  /** Datos completos del dashboard (KPIs, gráficos, alertas, etc.) */
  dashboardData: DashboardData | null = null;

  /** Indica si los datos se están cargando (útil para mostrar spinner) */
  isLoading = false;

  /** Fecha y hora de la última actualización exitosa */
  lastUpdate: Date | null = null;

  // ============================================================
  // 3. DATOS PARA GRÁFICOS (Chart.js) - Ahora solo almacenamos los datos,
  //    la creación y actualización la hace el servicio.
  // ============================================================
  /** Datos para el gráfico de línea (ventas últimos 7 días) */
  lineChartData: any = { labels: [], datasets: [] };
  /** Datos para el gráfico de barras (top productos) */
  barChartData: any = { labels: [], datasets: [] };
  /** Datos para el gráfico de dona (salud de inventario) */
  doughnutChartData: any = { labels: [], datasets: [] };

  // Las opciones ahora vienen del servicio
  get chartOptions() {
    return this.chartService.defaultChartOptions;
  }
  get doughnutOptions() {
    return this.chartService.doughnutOptions;
  }

  // ============================================================
  // 4. POLLING Y RECARGA POR NAVEGACIÓN
  // ============================================================
  private refreshInterval: any;
  private destroy$ = new Subject<void>();

  // ============================================================
  // 5. CICLO DE VIDA
  // ============================================================
  constructor() {
    // Registrar iconos usados en la plantilla
    addIcons({
      businessOutline,
      cashOutline,
      receiptOutline,
      cubeOutline,
      alertCircleOutline,
      statsChartOutline,
      pieChartOutline,
      analyticsOutline,
      layersOutline,
      cartOutline,
      peopleOutline,
      barChartOutline,
      settingsOutline,
      refreshOutline,
      timeOutline,
    });
  }

  ngOnInit() {
    // Carga inicial
    this.cargarDashboard();

    // Polling cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarDashboard(true);
    }, 30000);

    // Recarga automática al volver al dashboard
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        filter(() => this.router.url.includes('/app/dashboard')),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (!this.isLoading) {
          console.log('🔄 Recargando dashboard por navegación');
          this.cargarDashboard();
        }
      });
  }

  ngAfterViewInit() {
    // Los gráficos se renderizan automáticamente a través de la directiva BaseChartDirective.
    // Pero necesitamos asegurar que se redimensionen después de que la vista esté lista.
    setTimeout(() => {
      // Redimensionar gráficos usando el servicio
      this.chartService.resizeChart('lineChart');
      this.chartService.resizeChart('barChart');
      this.chartService.resizeChart('doughnutChart');
    }, 300);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
    // Destruir todos los gráficos al salir
    this.chartService.destroyAll();
  }

  // ============================================================
  // 6. CARGA DE DATOS
  // ============================================================
  async cargarDashboard(silent = false) {
    if (!silent) this.isLoading = true;

    try {
      const data = await firstValueFrom(this.dashboardApi.getDashboard());
      this.dashboardData = data;
      this.lastUpdate = new Date();

      // Actualizar datos de gráficos (los objetos se pasan a la directiva)
      this.actualizarGraficos();

      // Redimensionar gráficos después de actualizar
      setTimeout(() => {
        this.chartService.resizeChart('lineChart');
        this.chartService.resizeChart('barChart');
        this.chartService.resizeChart('doughnutChart');
      }, 100);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      if (!silent) {
        const toast = await this.toastCtrl.create({
          header: 'Error',
          message: 'No se pudo cargar el dashboard',
          duration: 3000,
          color: 'danger',
        });
        toast.present();
      }
    } finally {
      if (!silent) this.isLoading = false;
    }
  }

  // ============================================================
  // 7. ACTUALIZACIÓN DE GRÁFICOS
  // ============================================================
  /**
   * Actualiza los objetos de datos de los gráficos.
   * La directiva BaseChartDirective se encargará de renderizar los cambios.
   */
  actualizarGraficos() {
    if (!this.dashboardData) return;

    // 1. Gráfico de ventas (línea)
    const ventas7d = this.dashboardData.salesLast7Days;
    this.lineChartData = {
      labels: ventas7d.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: 'Ventas (S/.)',
          data: ventas7d.map((d) => d.total),
          borderColor: '#0a1a5c',
          backgroundColor: 'rgba(10,26,92,0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#0a1a5c',
          pointBorderColor: '#fff',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };

    // 2. Gráfico de top productos (barras)
    const top = this.dashboardData.topProducts;
    this.barChartData = {
      labels: top.map((p) =>
        p.name.length > 15 ? p.name.slice(0, 12) + '…' : p.name,
      ),
      datasets: [
        {
          label: 'Unidades vendidas',
          data: top.map((p) => p.quantity),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barPercentage: 0.7,
        },
      ],
    };

    // 3. Gráfico de inventario (dona)
    const kpis = this.dashboardData.kpis;
    const totalProd = kpis.productosTotales;
    const bajo = kpis.productosStockBajo;
    this.doughnutChartData = {
      labels: ['Stock normal', 'Stock bajo'],
      datasets: [
        {
          data: [totalProd - bajo, bajo],
          backgroundColor: ['#10b981', '#f59e0b'],
          hoverOffset: 4,
          borderWidth: 0,
        },
      ],
    };
  }

  // ============================================================
  // 8. NAVEGACIÓN Y UTILIDADES
  // ============================================================
  navigateTo(route: string) {
    this.router.navigate([`/app/${route}`]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-PE');
  }
}
