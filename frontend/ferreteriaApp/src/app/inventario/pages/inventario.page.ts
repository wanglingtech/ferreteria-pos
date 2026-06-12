// Angular e Ionic
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonBadge,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  cubeOutline,
  warningOutline,
  closeCircleOutline,
  cashOutline,
} from 'ionicons/icons';

// Servicios e interfaces
import { InventarioApiService } from '../services/inventario-api.service';
import {
  ResumenInventario,
  ProductoCritico,
} from '../interfaces/inventario.interface';

@Component({
  selector: 'app-inventario-page',
  standalone: true,
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonBadge,
    IonIcon,
    IonSpinner,
  ],
})
export class InventarioPage implements OnInit, OnDestroy {
  // ============================================================
  // 1. ESTADO REACTIVO (Señales)
  // ============================================================
  /** Resumen de KPIs (total, stock bajo, etc.) */
  resumen = signal<ResumenInventario | null>(null);
  /** Lista completa de productos críticos (se refresca automáticamente) */
  productosCriticos = signal<ProductoCritico[]>([]);
  /** Término de búsqueda escrito por el usuario */
  searchTerm = signal<string>('');
  /** Indica si los datos están cargándose inicialmente */
  isLoading = signal(false);

  // ============================================================
  // 2. FILTRADO LOCAL EN TIEMPO REAL (computado)
  // ============================================================
  /**
   * Devuelve los productos críticos que coinciden con el término de búsqueda
   * (por nombre o SKU). Se recalcula automáticamente cuando cambia searchTerm o productosCriticos.
   */
  filteredProductos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.productosCriticos();
    return this.productosCriticos().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term),
    );
  });

  // ============================================================
  // 3. POLLING (actualización automática)
  // ============================================================
  /** Intervalo en milisegundos (30 segundos) */
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 segundos
  /** Referencia al intervalo para poder limpiarlo al destruir el componente */
  private intervalId: any = null;

  // ============================================================
  // 4. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private inventarioApi = inject(InventarioApiService);
  private toastCtrl = inject(ToastController);

  // ============================================================
  // 5. CICLO DE VIDA
  // ============================================================
  constructor() {
    // Registrar los iconos que se usarán en la plantilla
    addIcons({
      searchOutline,
      cubeOutline,
      warningOutline,
      closeCircleOutline,
      cashOutline,
    });
  }

  ngOnInit() {
    // Carga inicial de datos
    this.cargarResumen();
    this.cargarProductosCriticos();
    // Iniciar el polling (actualización automática periódica)
    this.iniciarPolling();
  }

  /**
   * Al destruir el componente (por ejemplo, al salir de la página),
   * detener el intervalo para evitar fugas de memoria.
   */
  ngOnDestroy() {
    this.detenerPolling();
  }

  // ============================================================
  // 6. MÉTODOS DE CARGA DE DATOS
  // ============================================================
  /**
   * Obtiene el resumen de KPIs desde el backend y actualiza la señal.
   */
  cargarResumen() {
    this.inventarioApi.obtenerResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) =>
        this.mostrarError('Error cargando resumen', err?.error?.message),
    });
  }

  /**
   * Obtiene TODOS los productos críticos (sin filtro de búsqueda).
   * Actualiza la señal `productosCriticos` y desactiva el indicador de carga.
   */
  cargarProductosCriticos() {
    this.isLoading.set(true);
    // Se envía cadena vacía para obtener la lista completa (sin filtro backend)
    this.inventarioApi.obtenerProductosCriticos('').subscribe({
      next: (data) => {
        this.productosCriticos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error cargando alertas', err?.error?.message);
      },
    });
  }

  /**
   * Refresca ambos datos (resumen y productos críticos) simultáneamente.
   * Es llamado por el polling y también se podría usar para recarga manual.
   */
  refrescarDatosCompletos() {
    this.cargarResumen();
    this.cargarProductosCriticos();
  }

  // ============================================================
  // 7. MÉTODOS DE POLLING
  // ============================================================
  /**
   * Inicia un intervalo que ejecuta `refrescarDatosCompletos` cada
   * REFRESH_INTERVAL_MS milisegundos.
   */
  private iniciarPolling() {
    if (this.intervalId) return; // Evita duplicar intervalos
    this.intervalId = setInterval(() => {
      console.log('🔄 [Inventario] Actualizando datos automáticamente...');
      this.refrescarDatosCompletos();
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Detiene el intervalo de polling.
   */
  private detenerPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ============================================================
  // 8. MANEJO DE LA BÚSQUEDA EN TIEMPO REAL
  // ============================================================
  /**
   * Se ejecuta cada vez que el usuario escribe en el campo de búsqueda.
   * Recibe el valor como string (no un objeto Event) gracias a ngModelChange.
   * Solo actualiza la señal searchTerm, el filtrado es automático.
   */
  onSearch(valor: string) {
    this.searchTerm.set(valor);
    // No se hace ninguna llamada HTTP aquí → filtrado local instantáneo
  }

  // ============================================================
  // 9. UTILIDADES
  // ============================================================
  /**
   * Muestra un toast de error al usuario.
   */
  private async mostrarError(titulo: string, mensaje?: string) {
    const toast = await this.toastCtrl.create({
      header: titulo,
      message: mensaje || 'Ocurrió un error',
      duration: 4000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }
}
