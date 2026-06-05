import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
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
    IonLabel,
    IonBadge,
    IonIcon,
    IonSpinner,
  ],
})
export class InventarioPage implements OnInit {
  resumen = signal<ResumenInventario | null>(null);
  productosCriticos = signal<ProductoCritico[]>([]);
  filteredProductos = signal<ProductoCritico[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  private inventarioApi = inject(InventarioApiService);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ searchOutline, alertCircleOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.cargarResumen();
    this.cargarProductosCriticos();
  }

  cargarResumen() {
    this.inventarioApi.obtenerResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) =>
        this.mostrarError('Error cargando resumen', err?.error?.message),
    });
  }

  cargarProductosCriticos() {
    this.isLoading.set(true);
    this.inventarioApi.obtenerProductosCriticos(this.searchTerm()).subscribe({
      next: (data) => {
        this.productosCriticos.set(data);
        this.filteredProductos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error cargando alertas', err?.error?.message);
      },
    });
  }

  // Búsqueda en tiempo real
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.cargarProductosCriticos(); // Recarga con el filtro
  }

  getSeverityClass(producto: ProductoCritico): string {
    if (producto.stock <= 0) return 'critical';
    if (producto.stock <= (producto.minStock || 5) / 2) return 'high';
    return 'medium';
  }

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
