// =====================================================
// IMPORTACIONES NECESARIAS
// =====================================================
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
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

// Servicios e interfaces propias del módulo de inventario
import { InventarioApiService } from '../services/inventario-api.service';
import {
  ResumenInventario,
  ProductoCritico,
} from '../interfaces/inventario.interface';

// =====================================================
// DECORADOR @Component
// =====================================================
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
export class InventarioPage implements OnInit {
  // =====================================================
  // 1. SEÑALES (SIGNALS) PARA EL ESTADO REACTIVO
  // =====================================================

  /**
   * Almacena los datos del resumen de inventario (KPIs).
   * Inicialmente es null, luego se llena con la respuesta del backend.
   */
  resumen = signal<ResumenInventario | null>(null);

  /**
   * Lista original de productos críticos obtenida del backend.
   * Se carga una sola vez al iniciar la página.
   */
  productosCriticos = signal<ProductoCritico[]>([]);

  /**
   * Término de búsqueda ingresado por el usuario en el input.
   * Se actualiza cada vez que el usuario escribe.
   */
  searchTerm = signal<string>('');

  /**
   * Indica si los datos están siendo cargados (para mostrar spinner).
   */
  isLoading = signal(false);

  // =====================================================
  // 2. PROPIEDAD COMPUTADA (FILTRADO LOCAL EN TIEMPO REAL)
  // =====================================================

  /**
   * `filteredProductos` es un `computed` que devuelve la lista de productos críticos
   * filtrada según el `searchTerm`. Se recalcula automáticamente cada vez que cambia
   * `searchTerm` o `productosCriticos`. Esto permite que el buscador sea instantáneo,
   * sin necesidad de hacer nuevas peticiones HTTP.
   */
  filteredProductos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    // Si no hay término de búsqueda, mostrar todos los críticos
    if (!term) return this.productosCriticos();
    // Filtrar localmente por nombre o SKU (insensible a mayúsculas/minúsculas)
    return this.productosCriticos().filter(
      (producto) =>
        producto.name.toLowerCase().includes(term) ||
        producto.sku.toLowerCase().includes(term),
    );
  });

  // =====================================================
  // 3. INYECCIÓN DE DEPENDENCIAS
  // =====================================================
  private inventarioApi = inject(InventarioApiService);
  private toastCtrl = inject(ToastController);

  // =====================================================
  // 4. CONSTRUCTOR (REGISTRO DE ICONOS)
  // =====================================================
  constructor() {
    // Registrar los iconos que se usarán en la plantilla HTML
    addIcons({
      searchOutline,
      cubeOutline,
      warningOutline,
      closeCircleOutline,
      cashOutline,
    });
  }

  // =====================================================
  // 5. CICLO DE VIDA ngOnInit
  // =====================================================
  ngOnInit() {
    this.cargarResumen(); // Carga los KPIs
    this.cargarProductosCriticos(); // Carga la lista de productos críticos
  }

  // =====================================================
  // 6. MÉTODOS PRINCIPALES (LLAMADAS AL API)
  // =====================================================

  /**
   * Obtiene el resumen de inventario (totales, stock bajo, etc.) desde el backend
   * y actualiza la señal `resumen`.
   */
  cargarResumen() {
    this.inventarioApi.obtenerResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) =>
        this.mostrarError('Error cargando resumen', err?.error?.message),
    });
  }

  /**
   * Obtiene todos los productos críticos (stock <= 0 o stock <= stock mínimo)
   * desde el backend. Nota: se envía una cadena vacía como término de búsqueda
   * para que el backend devuelva TODOS los críticos. Luego el filtro local
   * (filteredProductos) se encargará de aplicar la búsqueda en tiempo real.
   */
  cargarProductosCriticos() {
    this.isLoading.set(true);
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

  // =====================================================
  // 7. MÉTODO DEL BUSCADOR (ACTUALIZA EL TÉRMINO)
  // =====================================================

  /**
   * Se ejecuta cada vez que el usuario escribe en el campo de búsqueda.
   * Recibe directamente el valor del input (no el evento DOM completo)
   * gracias a `(ngModelChange)="onSearch($event)"` en el HTML.
   * Actualiza la señal `searchTerm`, lo que provoca la recalculación automática
   * de `filteredProductos` (filtro local instantáneo).
   *
   * @param term - Valor actual del input (cadena de texto)
   */
  onSearch(term: string) {
    this.searchTerm.set(term);
  }

  // =====================================================
  // 8. UTILIDADES (MANEJO DE ERRORES)
  // =====================================================

  /**
   * Muestra un toast de error al usuario.
   * @param titulo - Título del error
   * @param mensaje - Mensaje detallado (opcional)
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
