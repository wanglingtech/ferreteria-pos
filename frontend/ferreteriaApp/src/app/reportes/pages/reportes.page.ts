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
} from 'ionicons/icons';

import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { ReportesApiService } from '../services/reportes-api.service';
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

    const labels = this.ventasPorDia.map((v) => v.date.slice(5));
    const data = this.ventasPorDia.map((v) => v.total);

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas (S/.)',
            data,
            borderColor: '#0a1a5c',
            backgroundColor: 'rgba(10,26,92,0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#0a1a5c',
            pointBorderColor: '#fff',
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

  exportReport() {
    if (!this.reporte) return;
    // Usamos separador punto y coma y codificación UTF-8 con BOM
    const separator = ';';
    const rows = [
      ['Métrica', 'Valor'],
      ['Ventas Totales', this.formatCurrencySimple(this.reporte.ventasTotales)],
      ['Subtotal', this.formatCurrencySimple(this.reporte.subtotalTotal)],
      ['IGV', this.formatCurrencySimple(this.reporte.igvTotal)],
      ['Total Órdenes', this.reporte.totalOrdenes.toString()],
      [
        'Ticket Promedio',
        this.formatCurrencySimple(this.reporte.ticketPromedio),
      ],
      ['Clientes Atendidos', this.reporte.clientesAtendidos.toString()],
      [],
      ['Top Productos'],
      ['SKU', 'Nombre', 'Cantidad', 'Total Vendido'],
    ];
    this.reporte.topProductos.forEach((p) => {
      rows.push([
        p.sku,
        p.nombre,
        p.cantidadVendida.toString(),
        this.formatCurrencySimple(p.totalVendido),
      ]);
    });
    const csvContent = rows.map((row) => row.join(separator)).join('\n');
    // Agregar BOM para UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reporte_${this.from}_${this.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.mostrarExito('Reporte exportado a CSV');
  }

  formatCurrencySimple(value: number): string {
    return `S/ ${value.toFixed(2)}`;
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    // Redibujar gráficos si se cambia a pestaña que los contiene
    if (tab === 'resumen' || tab === 'ventas') {
      setTimeout(() => this.renderCharts(), 100);
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
      duration: 3000,
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
