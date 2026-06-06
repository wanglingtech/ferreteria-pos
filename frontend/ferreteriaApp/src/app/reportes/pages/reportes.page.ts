import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  calendarOutline,
  barChartOutline,
  statsChartOutline,
  downloadOutline,
  trendingUpOutline,
  calculatorOutline,
  documentTextOutline,
  peopleOutline,
  walletOutline,
  receiptOutline,
  cashOutline,
  pieChartOutline,
  printOutline,
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { ReportesApiService } from '../services/reportes-api.service';
import { ReportesExportService } from '../services/reportes-export.service';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class ReportesPage implements OnInit, AfterViewInit {
  @ViewChild('salesChartCanvas')
  salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChartCanvas')
  topProductsChartCanvas!: ElementRef<HTMLCanvasElement>;
  private salesChart: Chart | null = null;
  private topProductsChart: Chart | null = null;

  from = '';
  to = '';
  activeTab = 'resumen';
  reporte: ReporteGeneral | null = null;
  ventasPorDia: VentaPorDia[] = [];
  isLoading = false;

  private reportesApi = inject(ReportesApiService);
  private exportService = inject(ReportesExportService);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      analyticsOutline,
      calendarOutline,
      barChartOutline,
      statsChartOutline,
      downloadOutline,
      trendingUpOutline,
      calculatorOutline,
      documentTextOutline,
      peopleOutline,
      walletOutline,
      receiptOutline,
      cashOutline,
      pieChartOutline,
      printOutline,
    });
  }

  ngOnInit() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.to = today.toISOString().split('T')[0];
    this.from = sevenDaysAgo.toISOString().split('T')[0];
    this.loadReport();
  }

  ngAfterViewInit() {}

  async loadReport() {
    this.isLoading = true;
    try {
      const [resumen, ventas] = await Promise.all([
        firstValueFrom(this.reportesApi.obtenerResumen(this.from, this.to)),
        firstValueFrom(
          this.reportesApi.obtenerVentasPorDia(this.from, this.to),
        ),
      ]);
      this.reporte = resumen;
      this.ventasPorDia = ventas;
      this.renderCharts();
    } catch (error) {
      console.error(error);
      this.mostrarError('No se pudo cargar el reporte');
    } finally {
      this.isLoading = false;
    }
  }

  renderCharts() {
    this.renderSalesChart();
    this.renderTopProductsChart();
  }

  renderSalesChart() {
    if (!this.salesChartCanvas) return;
    if (this.salesChart) this.salesChart.destroy();

    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let labels: string[] = [];
    let data: number[] = [];

    if (this.ventasPorDia && this.ventasPorDia.length) {
      labels = this.ventasPorDia.map((v) => v.date.slice(5));
      data = this.ventasPorDia.map((v) => v.total);
    } else {
      labels = ['Sin datos'];
      data = [0];
    }

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas (S/.)',
            data,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: { label: (ctx) => `S/ ${ctx.parsed.y.toFixed(2)}` },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e2e8f0' },
            ticks: { callback: (val) => `S/ ${val}` },
          },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    });
  }

  renderTopProductsChart() {
    if (!this.topProductsChartCanvas || !this.reporte) return;
    if (this.topProductsChart) this.topProductsChart.destroy();

    const ctx = this.topProductsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const top = this.reporte.topProductos.slice(0, 5);
    if (!top.length) {
      this.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Sin datos'],
          datasets: [
            {
              label: 'Unidades vendidas',
              data: [0],
              backgroundColor: '#cbd5e1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
        },
      });
      return;
    }

    const labels = top.map((p) =>
      p.nombre.length > 15 ? p.nombre.slice(0, 12) + '…' : p.nombre,
    );
    const data = top.map((p) => p.cantidadVendida);

    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Unidades vendidas',
            data,
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.parsed.y} unidades` },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e2e8f0' },
            ticks: { stepSize: 1 },
          },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    });
  }

  exportToCSV() {
    if (!this.reporte) return;
    try {
      this.exportService.exportToCSV(
        this.reporte,
        this.ventasPorDia,
        this.from,
        this.to,
      );
      this.mostrarExito('Reporte exportado a CSV');
    } catch (error) {
      this.mostrarError('Error al exportar a CSV');
    }
  }

  exportToPDF() {
    if (!this.reporte) return;
    try {
      this.exportService.exportToPDF(
        this.reporte,
        this.ventasPorDia,
        this.from,
        this.to,
        'assets/logo/logo_ferreteria.png',
      );
      this.mostrarExito('Reporte exportado a PDF');
    } catch (error: any) {
      this.mostrarError(
        error.message ||
          'Error al generar PDF. Verifica que las ventanas emergentes estén permitidas.',
      );
    }
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'resumen' || tab === 'ventas') {
      setTimeout(() => this.renderSalesChart(), 100);
    } else if (tab === 'productos') {
      setTimeout(() => this.renderTopProductsChart(), 100);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 4000,
      color: 'danger',
      position: 'top',
    });
    toast.present();
  }
  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    toast.present();
  }
}
