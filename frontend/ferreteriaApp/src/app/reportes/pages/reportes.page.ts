// ============================================================
// REPORTES PAGE - ANÁLISIS DE VENTAS CON GRÁFICOS Y EXPORTACIÓN
// Usa la directiva baseChart (ng2-charts) para renderizar gráficos,
// gestionados por ChartService para opciones y consistencia.
// ============================================================

import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  OnDestroy,
  ViewChild, // ✅ IMPORTANTE: agregar ViewChild
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

// ✅ Importar la directiva baseChart
import { BaseChartDirective } from 'ng2-charts';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ReportesApiService } from '../services/reportes-api.service';
import { ReportesExportService } from '../services/reportes-export.service';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';
import { Venta } from '../../ventas/interfaces/venta.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationService } from '../../core/services/notification.service';
// ✅ Importar el servicio de gráficos (para opciones)
import { ChartService } from '../../core/services/chart.service';
// Para generar imágenes de ventas
import html2canvas from 'html2canvas';

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
    BaseChartDirective, // ✅ IMPRESCINDIBLE para usar baseChart en el HTML
  ],
})
export class ReportesPage implements OnInit, OnDestroy {
  // ============================================================
  // 1. REFERENCIAS A MODALES
  // ============================================================
  @ViewChild('detalleModal') detalleModal!: IonModal; // ✅ Ahora ViewChild está importado

  // ============================================================
  // 2. ESTADO Y DATOS
  // ============================================================
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

  // ============================================================
  // 3. DATOS Y OPCIONES PARA GRÁFICOS (baseChart)
  // ============================================================
  /** Datos para el gráfico de líneas (evolución de ventas) */
  salesChartData: any = { labels: [], datasets: [] };
  /** Datos para el gráfico de barras (top productos) */
  topProductsChartData: any = { labels: [], datasets: [] };

  /** Opciones para el gráfico de líneas (tomadas del servicio) */
  get salesChartOptions() {
    return this.chartService.lineChartOptions;
  }
  /** Opciones para el gráfico de barras (tomadas del servicio) */
  get barChartOptions() {
    return this.chartService.barChartOptions;
  }

  // ============================================================
  // 4. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private reportesApi = inject(ReportesApiService);
  private exportService = inject(ReportesExportService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private notificationService = inject(NotificationService);
  private actionSheetCtrl = inject(ActionSheetController);
  private chartService = inject(ChartService); // Para opciones

  // ============================================================
  // 5. GETTER PARA NOMBRE DE USUARIO (usado en exportación)
  // ============================================================
  get currentUserName(): string {
    const user = this.authSession.getCurrentUser();
    return user?.fullName || user?.username || 'Usuario';
  }

  // ============================================================
  // 6. CICLO DE VIDA
  // ============================================================
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
    // Fechas por defecto: últimos 7 días
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.to = today.toISOString().split('T')[0];
    this.from = sevenDaysAgo.toISOString().split('T')[0];

    // Carga inicial
    this.loadReport();

    // Debounce para búsqueda en tabla general
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.pageGeneral = 1;
      this.cargarVentasGenerales();
    });

    // Polling opcional (comentado)
    // this.iniciarPolling();
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.searchSubject.complete();
  }

  // ============================================================
  // 7. CARGA DEL REPORTE
  // ============================================================
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

      // Actualizar gráficos
      this.actualizarGraficos();

      if (this.activeTab === 'generales') {
        this.cargarVentasGenerales();
      }
    } catch (error) {
      console.error(error);
      this.mostrarError('No se pudo cargar el reporte');
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================================
  // 8. ACTUALIZACIÓN DE GRÁFICOS (asignando datos a las propiedades)
  // ============================================================
  /**
   * Actualiza los datos de los gráficos. La directiva baseChart
   * detecta los cambios automáticamente y re-renderiza.
   */
  actualizarGraficos() {
    // 1. Gráfico de líneas (ventas por día)
    let labels: string[] = [];
    let data: number[] = [];
    if (this.ventasPorDia && this.ventasPorDia.length) {
      labels = this.ventasPorDia.map((v) => v.date.slice(5)); // 'MM-DD'
      data = this.ventasPorDia.map((v) => v.total);
    } else {
      labels = ['Sin datos'];
      data = [0];
    }

    this.salesChartData = {
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
    };

    // 2. Gráfico de barras (top productos)
    if (this.reporte) {
      const top = this.reporte.topProductos.slice(0, 5);
      if (top.length === 0) {
        this.topProductsChartData = {
          labels: ['Sin datos'],
          datasets: [
            {
              label: 'Unidades vendidas',
              data: [0],
              backgroundColor: '#cbd5e1',
            },
          ],
        };
      } else {
        this.topProductsChartData = {
          labels: top.map((p) =>
            p.nombre.length > 15 ? p.nombre.slice(0, 12) + '…' : p.nombre,
          ),
          datasets: [
            {
              label: 'Unidades vendidas',
              data: top.map((p) => p.cantidadVendida),
              backgroundColor: '#3b82f6',
              borderRadius: 6,
              barPercentage: 0.7,
            },
          ],
        };
      }
    }
  }

  // ============================================================
  // 9. TABLA GENERAL DE VENTAS (paginada)
  // ============================================================
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

  // ============================================================
  // 10. MENÚ DE OPCIONES PARA VENTAS
  // ============================================================
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

  verDetalleVenta(venta: Venta) {
    this.ventaSeleccionada = venta;
    this.detalleModal.present();
  }

  // ============================================================
  // 11. COMPARTIR / DESCARGAR IMAGEN DE VENTA
  // ============================================================
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

  async compartirDesdeModalComoImagen() {
    if (!this.ventaSeleccionada) return;
    await this.compartirImagenVenta(this.ventaSeleccionada);
    this.detalleModal.dismiss();
  }

  // ============================================================
  // 12. POLLING (opcional)
  // ============================================================
  iniciarPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      if (document.hasFocus()) {
        console.log('🔄 Actualizando reportes automáticamente...');
        this.loadReport();
      }
    }, 30000);
  }

  // ============================================================
  // 13. EXPORTACIÓN A CSV / PDF
  // ============================================================
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

  // ============================================================
  // 14. CAMBIO DE PESTAÑA
  // ============================================================
  changeTab(tab: string) {
    this.activeTab = tab;
    // Al cambiar a pestañas que muestran gráficos, forzamos la actualización
    if (tab === 'resumen' || tab === 'ventas' || tab === 'productos') {
      this.actualizarGraficos();
    } else if (tab === 'generales') {
      this.cargarVentasGenerales();
    }
  }

  // ============================================================
  // 15. UTILIDADES
  // ============================================================
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
