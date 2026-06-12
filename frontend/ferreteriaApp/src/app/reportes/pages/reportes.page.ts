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
  IonTitle,
  ActionSheetController,
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
  shareSocialOutline,
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
    IonHeader,
    IonToolbar,
    IonTitle,
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
  private actionSheetCtrl = inject(ActionSheetController);

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
      shareSocialOutline,
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
    // Opcional: polling cada 30 segundos
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

  // ==================== MENÚ DE OPCIONES PARA CADA VENTA ====================
  async opcionesVenta(venta: Venta) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones de venta',
      buttons: [
        {
          text: 'Ver detalle',
          icon: 'eye-outline',
          handler: () => this.verDetalleVenta(venta),
        },
        {
          text: 'Compartir imagen',
          icon: 'share-social-outline',
          handler: () => this.compartirImagenVenta(venta),
        },
        {
          text: 'Descargar imagen',
          icon: 'download-outline',
          handler: () => this.descargarImagenVenta(venta),
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  // Mostrar modal con detalle
  verDetalleVenta(venta: Venta) {
    this.ventaSeleccionada = venta;
    this.detalleModal.present();
  }

  // Genera y comparte imagen de la venta (sin abrir modal)
  async compartirImagenVenta(venta: Venta) {
    const blobImagen = await this.generarImagenVenta(venta);
    if (!blobImagen) return;
    if (navigator.share) {
      const file = new File([blobImagen], `venta-${venta.code}.png`, {
        type: 'image/png',
      });
      try {
        await navigator.share({
          title: `Venta ${venta.code}`,
          text: `Total: ${this.formatCurrency(venta.total)}`,
          files: [file],
        });
        this.mostrarExito('Imagen compartida');
      } catch (err: any) {
        if (err.name !== 'AbortError')
          this.mostrarError('No se pudo compartir la imagen', err.message);
      }
    } else {
      this.descargarImagenVenta(venta);
    }
  }

  // Genera y descarga la imagen de la venta
  async descargarImagenVenta(venta: Venta) {
    const blobImagen = await this.generarImagenVenta(venta);
    if (!blobImagen) return;
    const url = URL.createObjectURL(blobImagen);
    const link = document.createElement('a');
    link.href = url;
    link.download = `venta-${venta.code}.png`;
    link.click();
    URL.revokeObjectURL(url);
    this.mostrarExito('Imagen descargada');
  }

  // Construye un elemento HTML temporal con los datos de la venta y lo convierte a imagen
  private async generarImagenVenta(venta: Venta): Promise<Blob | null> {
    const divTemp = document.createElement('div');
    divTemp.className = 'temp-detalle-venta';
    divTemp.style.backgroundColor = 'white';
    divTemp.style.padding = '20px';
    divTemp.style.width = '800px';
    divTemp.style.borderRadius = '16px';
    divTemp.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    divTemp.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #0a1a5c; padding-bottom: 12px; margin-bottom: 16px;">
        <img src="assets/logo/logo_ferreteria.png" style="width: 60px; margin-bottom: 8px;" />
        <h3 style="margin:0; color:#0a1a5c;">Ferretería July</h3>
        <p style="font-size:11px; color:#475569;">RUC: 10097428951 | Av. México 118, Comas</p>
      </div>
      <div style="margin-bottom:16px;">
        <p><strong>Venta N°:</strong> ${venta.code}</p>
        <p><strong>Fecha:</strong> ${new Date(venta.createdAt).toLocaleString('es-PE')}</p>
        <p><strong>Cliente:</strong> ${venta.customerName || 'Consumidor Final'}</p>
        <p><strong>Vendedor:</strong> ${venta.seller.fullName}</p>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead><tr style="background:#f1f5f9;"><th style="padding:8px; text-align:left;">Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${venta.items
              .map(
                (item) => `
              <tr><td style="padding:6px; border-bottom:1px solid #e2e8f0;">${item.product.name}</td>
              <td style="padding:6px; border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
              <td style="padding:6px; border-bottom:1px solid #e2e8f0;">${this.formatCurrency(item.unitPrice)}</td>
              <td style="padding:6px; border-bottom:1px solid #e2e8f0;">${this.formatCurrency(item.lineTotal)}</td></tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align:right; margin-top:16px;">
        <p>Subtotal: ${this.formatCurrency(venta.subtotal)}</p>
        <p>IGV (18%): ${this.formatCurrency(venta.igv)}</p>
        <p><strong>TOTAL: ${this.formatCurrency(venta.total)}</strong></p>
      </div>
      <div style="text-align:center; margin-top:20px; font-size:10px; color:#94a3b8;">¡Gracias por su compra!</div>
    `;
    document.body.appendChild(divTemp);
    try {
      const canvas = await html2canvas(divTemp, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      return blob;
    } catch (error) {
      console.error('Error generando imagen', error);
      this.mostrarError('No se pudo generar la imagen');
      return null;
    } finally {
      document.body.removeChild(divTemp);
    }
  }

  // Compartir desde el modal (si se desea)
  async compartirDesdeModalComoImagen() {
    if (!this.ventaSeleccionada) return;
    await this.compartirImagenVenta(this.ventaSeleccionada);
    this.detalleModal.dismiss();
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

  private async mostrarError(mensaje: string, detalle?: string) {
    const toast = await this.toastCtrl.create({
      message: detalle ? `${mensaje}: ${detalle}` : mensaje,
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
