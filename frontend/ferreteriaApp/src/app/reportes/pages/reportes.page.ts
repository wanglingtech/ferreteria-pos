import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle, // ✅ añadidos
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
  listOutline,
  searchOutline,
  closeOutline,
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ReportesApiService } from '../services/reportes-api.service';
import { ReportesExportService } from '../services/reportes-export.service';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';
import { Venta } from '../../ventas/interfaces/venta.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
import html2canvas from 'html2canvas';

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
    IonModal,
    IonHeader, // ✅ añadido
    IonToolbar, // ✅ añadido
    IonTitle, // ✅ añadido
  ],
})
export class ReportesPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChartCanvas')
  salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChartCanvas')
  topProductsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('detalleModal') detalleModal!: IonModal;
  private salesChart: Chart | null = null;
  private topProductsChart: Chart | null = null;

  from = '';
  to = '';
  activeTab = 'resumen';
  reporte: ReporteGeneral | null = null;
  ventasPorDia: VentaPorDia[] = [];
  isLoading = false;

  searchGeneral = '';
  ventasGenerales: Venta[] = [];
  loadingGeneral = false;
  pageGeneral = 1;
  pageSizeGeneral = 10;
  totalGeneralPages = 0;
  ventaSeleccionada: Venta | null = null;
  private searchSubject = new Subject<string>();

  private pollingInterval: any = null;

  private reportesApi = inject(ReportesApiService);
  private exportService = inject(ReportesExportService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private notificationService = inject(NotificationService);

  get currentUserName(): string {
    const user = this.authSession.getCurrentUser();
    return user?.fullName || user?.username || 'Usuario';
  }

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
      listOutline,
      searchOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.to = today.toISOString().split('T')[0];
    this.from = sevenDaysAgo.toISOString().split('T')[0];
    this.loadReport();

    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.pageGeneral = 1;
      this.cargarVentasGenerales();
    });

    // Opcional: polling cada 30 segundos (descomentar si se desea)
    // this.iniciarPolling();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.searchSubject.complete();
  }

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
      if (this.activeTab === 'generales') this.cargarVentasGenerales();
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
    let labels: string[] = [],
      data: number[] = [];
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
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: (ctx) => `S/ ${ctx.parsed.y.toFixed(2)}` },
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (val) => `S/ ${val}` } },
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
        options: { responsive: true, maintainAspectRatio: false },
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
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.parsed.y} unidades` },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }

  async cargarVentasGenerales() {
    this.loadingGeneral = true;
    try {
      const result = await firstValueFrom(
        this.reportesApi.obtenerVentasPaginadas(
          this.from,
          this.to,
          this.searchGeneral,
          this.pageGeneral,
          this.pageSizeGeneral,
        ),
      );
      this.ventasGenerales = result.items;
      this.totalGeneralPages = result.totalPages;
    } catch (error) {
      console.error(error);
      this.mostrarError('Error al cargar ventas');
    } finally {
      this.loadingGeneral = false;
    }
  }

  onSearchGeneralChange() {
    this.searchSubject.next(this.searchGeneral);
  }

  cambiarPaginaGeneral(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalGeneralPages) return;
    this.pageGeneral = nuevaPagina;
    this.cargarVentasGenerales();
  }

  verDetalleVenta(venta: Venta) {
    this.ventaSeleccionada = venta;
    this.detalleModal.present();
  }

  async compartirDetalleComoImagen() {
    const element = document.getElementById('detalleVentaContent');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imageData = canvas.toDataURL('image/png');
      if (navigator.share) {
        const blob = await (await fetch(imageData)).blob();
        const file = new File(
          [blob],
          `venta-${this.ventaSeleccionada?.code}.png`,
          { type: 'image/png' },
        );
        await navigator.share({
          title: `Venta ${this.ventaSeleccionada?.code}`,
          text: `Total: ${this.formatCurrency(this.ventaSeleccionada?.total || 0)}`,
          files: [file],
        });
        this.mostrarExito('Imagen compartida');
      } else {
        const link = document.createElement('a');
        link.download = `venta-${this.ventaSeleccionada?.code}.png`;
        link.href = imageData;
        link.click();
        this.mostrarExito('Imagen descargada');
      }
    } catch (error) {
      console.error(error);
      this.mostrarError('No se pudo compartir la imagen');
    }
  }

  iniciarPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      if (document.hasFocus()) {
        console.log('🔄 Actualizando reportes automáticamente...');
        this.loadReport();
      }
    }, 30000);
  }

  async exportToCSV() {
    if (!this.reporte) return;
    try {
      this.exportService.exportToCSV(
        this.reporte,
        this.ventasPorDia,
        this.from,
        this.to,
        this.currentUserName,
      );
      this.mostrarExito('Reporte exportado a CSV');
      await firstValueFrom(
        this.notificationService.crearNotificacionFrontend({
          type: 'reporte_exportado',
          title: 'Reporte exportado',
          message: `Exportaste un reporte de ventas en formato CSV (${this.from} al ${this.to})`,
          data: { tipo: 'CSV', desde: this.from, hasta: this.to },
        }),
      );
    } catch (error) {
      this.mostrarError('Error al exportar a CSV');
    }
  }

  async exportToPDF() {
    if (!this.reporte) return;
    try {
      this.exportService.exportToPDF(
        this.reporte,
        this.ventasPorDia,
        this.from,
        this.to,
        '/assets/logo/logo_ferreteria.png',
        this.currentUserName,
      );
      this.mostrarExito('Reporte exportado a PDF');
      await firstValueFrom(
        this.notificationService.crearNotificacionFrontend({
          type: 'reporte_exportado',
          title: 'Reporte exportado',
          message: `Exportaste un reporte de ventas en formato PDF (${this.from} al ${this.to})`,
          data: { tipo: 'PDF', desde: this.from, hasta: this.to },
        }),
      );
    } catch (error: any) {
      this.mostrarError(
        error.message || 'Error al generar PDF. Permite ventanas emergentes.',
      );
    }
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'resumen' || tab === 'ventas')
      setTimeout(() => this.renderSalesChart(), 100);
    else if (tab === 'productos')
      setTimeout(() => this.renderTopProductsChart(), 100);
    else if (tab === 'generales') this.cargarVentasGenerales();
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
