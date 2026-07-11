import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  AfterViewInit,
  ViewChildren,
  QueryList,
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

import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { firstValueFrom, Subject, filter, takeUntil } from 'rxjs';

import { DashboardApiService } from '../services/dashboard-api.service';
import { DashboardData } from '../interfaces/dashboard.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';

Chart.register(...registerables);

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
    BaseChartDirective,
  ],
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // ============================================================
  // 1. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private authSession = inject(AuthSessionService);
  private dashboardApi = inject(DashboardApiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

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
  // 3. DATOS PARA GRÁFICOS (Chart.js)
  // ============================================================
  lineChartData: any = { labels: [], datasets: [] };
  barChartData: any = { labels: [], datasets: [] };
  doughnutChartData: any = { labels: [], datasets: [] };

  /** Opciones comunes para gráficos de línea y barras */
  chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 10 } } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
      x: { grid: { display: false } },
    },
  };

  /** Opciones para el gráfico de dona (inventario) */
  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 10 } } },
    },
  };

  // ============================================================
  // 4. POLLING Y RECARGA POR NAVEGACIÓN
  // ============================================================
  /** Intervalo para actualización automática cada 30 segundos */
  private refreshInterval: any;

  /** Subject para limpiar suscripciones al destruir el componente */
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
    // 1. Carga inicial de datos
    this.cargarDashboard();

    // 2. Configurar polling cada 30 segundos (en segundo plano)
    this.refreshInterval = setInterval(() => {
      // Cargar en modo silencioso (sin mostrar spinner ni errores)
      this.cargarDashboard(true);
    }, 30000);

    // 3. ✅ RECARGA AUTOMÁTICA AL VOLVER AL DASHBOARD
    // Escuchamos eventos de navegación y si la ruta es /app/dashboard, recargamos.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        filter(() => this.router.url.includes('/app/dashboard')),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        // Solo recargamos si no estamos en medio de una carga
        if (!this.isLoading) {
          console.log('🔄 Recargando dashboard por navegación a la página');
          this.cargarDashboard();
        }
      });
  }

  ngAfterViewInit() {
    // Esperar a que los gráficos se rendericen y redimensionarlos
    setTimeout(() => {
      this.charts.forEach((chart) => chart?.chart?.resize());
    }, 300);
  }

  ngOnDestroy() {
    // Limpiar intervalos y suscripciones para evitar memory leaks
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // 6. CARGA DE DATOS
  // ============================================================
  /**
   * Carga los datos del dashboard desde el backend.
   * @param silent Si es true, no muestra spinner ni errores (para polling).
   */
  async cargarDashboard(silent = false) {
    if (!silent) this.isLoading = true;

    try {
      // Obtener datos del API
      const data = await firstValueFrom(this.dashboardApi.getDashboard());
      this.dashboardData = data;
      this.lastUpdate = new Date();

      // Actualizar gráficos con los nuevos datos
      this.actualizarGraficos();

      // Redimensionar gráficos después de actualizar
      setTimeout(() => {
        this.charts.forEach((chart) => chart?.chart?.resize());
      }, 100);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      // Solo mostramos error si no es silencioso
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
   * Actualiza los tres gráficos del dashboard con los datos actuales.
   * Se ejecuta cada vez que se cargan nuevos datos.
   */
  actualizarGraficos() {
    if (!this.dashboardData) return;

    // 1. Gráfico de ventas de los últimos 7 días (línea)
    const ventas7d = this.dashboardData.salesLast7Days;
    this.lineChartData = {
      labels: ventas7d.map((d) => d.date.slice(5)), // formato 'MM-DD'
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

    // 3. Gráfico de salud del inventario (dona)
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
  // 8. MÉTODOS DEL BOTÓN DE ACTUALIZACIÓN (DESCONTINUADO)
  // ============================================================
  /**
   * Método para actualizar manualmente (ya no se usa, se mantiene por compatibilidad)
   * PERO LO QUITAMOS DE LA VISTA (HTML) PARA NO MOSTRARLO.
   * Lo dejamos aquí por si se necesitara en el futuro.
   */
  // refresh(event: any) {
  //   this.cargarDashboard().finally(() => event.target.complete());
  // }

  // ============================================================
  // 9. NAVEGACIÓN A MÓDULOS
  // ============================================================
  /**
   * Navega a un módulo específico desde la vista de "Módulos".
   * @param route Nombre de la ruta (ej: 'inventario', 'ventas').
   */
  navigateTo(route: string) {
    this.router.navigate([`/app/${route}`]);
  }

  // ============================================================
  // 10. UTILIDADES DE FORMATO
  // ============================================================
  /**
   * Formatea un número como moneda en soles (PEN).
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formatea una fecha a formato local (es-PE).
   */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-PE');
  }
}
