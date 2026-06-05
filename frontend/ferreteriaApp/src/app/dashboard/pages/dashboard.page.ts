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
import { Router } from '@angular/router';
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
import { firstValueFrom } from 'rxjs';

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

  private authSession = inject(AuthSessionService);
  get user() {
    return this.authSession.getCurrentUser();
  }

  activeView = 'overview';
  dashboardData: DashboardData | null = null;
  isLoading = false;
  lastUpdate: Date | null = null;
  private refreshInterval: any;

  lineChartData: any = { labels: [], datasets: [] };
  barChartData: any = { labels: [], datasets: [] };
  doughnutChartData: any = { labels: [], datasets: [] };

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

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 10 } } },
    },
  };

  private dashboardApi = inject(DashboardApiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  constructor() {
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
    this.cargarDashboard();
    this.refreshInterval = setInterval(() => this.cargarDashboard(true), 30000);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.charts.forEach((chart) => chart?.chart?.resize());
    }, 300);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  async cargarDashboard(silent = false) {
    if (!silent) this.isLoading = true;
    try {
      const data = await firstValueFrom(this.dashboardApi.getDashboard());
      this.dashboardData = data;
      this.lastUpdate = new Date();
      this.actualizarGraficos();
      setTimeout(() => {
        this.charts.forEach((chart) => chart?.chart?.resize());
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

  actualizarGraficos() {
    if (!this.dashboardData) return;
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

  refresh(event: any) {
    this.cargarDashboard().finally(() => event.target.complete());
  }

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
