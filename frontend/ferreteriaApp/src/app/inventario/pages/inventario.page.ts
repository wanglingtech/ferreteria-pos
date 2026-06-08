import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
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
export class InventarioPage implements OnInit {
  // Señales para manejar estado reactivo
  resumen = signal<ResumenInventario | null>(null); // KPIs
  productosCriticos = signal<ProductoCritico[]>([]); // Lista original (críticos)
  filteredProductos = signal<ProductoCritico[]>([]); // Lista filtrada por búsqueda
  isLoading = signal(false); // Control de carga
  searchTerm = signal(''); // Término de búsqueda actual

  private inventarioApi = inject(InventarioApiService);
  private toastCtrl = inject(ToastController);

  constructor() {
    // Registrar los iconos utilizados en la plantilla
    addIcons({
      searchOutline,
      cubeOutline,
      warningOutline,
      closeCircleOutline,
      cashOutline,
    });
  }

  ngOnInit() {
    this.cargarResumen(); // Obtener KPIs al iniciar
    this.cargarProductosCriticos(); // Obtener lista de productos críticos
  }

  /**
   * Obtiene los indicadores resumen del inventario (total, stock bajo, sin stock, valorización)
   */
  cargarResumen() {
    this.inventarioApi.obtenerResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) =>
        this.mostrarError('Error cargando resumen', err?.error?.message),
    });
  }

  /**
   * Obtiene los productos críticos (stock bajo o sin stock) y aplica el término de búsqueda actual.
   * El backend ya filtra por el término, por lo que la lista resultante es la ya filtrada.
   */
  cargarProductosCriticos() {
    this.isLoading.set(true);
    this.inventarioApi.obtenerProductosCriticos(this.searchTerm()).subscribe({
      next: (data) => {
        this.productosCriticos.set(data);
        this.filteredProductos.set(data); // Ambos coinciden porque el backend ya filtró
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error cargando alertas', err?.error?.message);
      },
    });
  }

  /**
   * Se dispara cada vez que el usuario escribe en el buscador.
   * Actualiza el término de búsqueda y recarga la lista.
   */
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.cargarProductosCriticos(); // Llamada al backend con el nuevo término
  }

  /**
   * Determina la clase de gravedad para cada producto (útil para estilos adicionales)
   */
  getSeverityClass(producto: ProductoCritico): string {
    if (producto.stock <= 0) return 'critical';
    const limite = producto.minStock > 0 ? producto.minStock : 5;
    if (producto.stock <= limite / 2) return 'high';
    return 'medium';
  }

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
