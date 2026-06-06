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
  IonSpinner, // ✅ Agregado
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
    IonSpinner, // ✅ Agregado
  ],
})
export class ReportesPage implements OnInit, AfterViewInit {
  @ViewChild('salesChartCanvas')
  salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

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
      this.renderChart();
    } catch (error) {
      console.error(error);
      this.mostrarError('No se pudo cargar el reporte');
    } finally {
      this.isLoading = false;
    }
  }

  renderChart() {
    if (!this.salesChartCanvas) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.ventasPorDia.map((v) => v.date.slice(5));
    const data = this.ventasPorDia.map((v) => v.total);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas (S/.)',
            data,
            borderColor: '#ffffff',
            backgroundColor: 'rgba(255,255,255,0.2)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#0a1a5c',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#fff' } },
          tooltip: {
            callbacks: { label: (ctx) => `S/ ${ctx.parsed.y.toFixed(2)}` },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.2)' },
            ticks: { color: '#fff' },
          },
          x: { ticks: { color: '#fff' }, grid: { display: false } },
        },
      },
    });
  }

  exportReport() {
    if (!this.reporte) return;
    const rows = [
      ['Métrica', 'Valor'],
      ['Ventas Totales', this.formatCurrency(this.reporte.ventasTotales)],
      ['Subtotal', this.formatCurrency(this.reporte.subtotalTotal)],
      ['IGV', this.formatCurrency(this.reporte.igvTotal)],
      ['Total Órdenes', this.reporte.totalOrdenes],
      ['Ticket Promedio', this.formatCurrency(this.reporte.ticketPromedio)],
      ['Clientes Atendidos', this.reporte.clientesAtendidos],
      [],
      ['Top Productos'],
      ['SKU', 'Nombre', 'Cantidad', 'Total Vendido'],
    ];
    this.reporte.topProductos.forEach((p) => {
      rows.push([
        p.sku,
        p.nombre,
        p.cantidadVendida.toString(),
        this.formatCurrency(p.totalVendido),
      ]);
    });
    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

  changeTab(tab: string) {
    this.activeTab = tab;
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
