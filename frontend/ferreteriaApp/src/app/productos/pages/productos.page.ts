import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  cubeOutline,
  filterOutline,
  searchOutline,
} from 'ionicons/icons';

/**
 * CONTRATO REAL (alineado a backend Prisma)
 */
interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
  imagenUrl: string;
}

@Component({
  selector: 'app-productos-page',
  standalone: true,
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class ProductosPage {
  private http = inject(HttpClient);

  private API_URL = '/api/productos';

  search = signal('');
  selectedFilter = signal<'all' | 'active' | 'inactive'>('all');

  productos = signal<Producto[]>([]);

  constructor() {
    addIcons({
      searchOutline,
      filterOutline,
      createOutline,
      addOutline,
      cubeOutline,
    });

    this.loadProducts();
  }

  /**
   * 🔥 BACKEND REAL
   * GET /productos?search=&status=
   */
  loadProducts(): void {
    const params: any = {
      search: this.search(),
      status: this.selectedFilter(),
    };

    this.http.get<Producto[]>(this.API_URL, { params }).subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => console.error('Error cargando productos', err),
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.loadProducts();
  }

  onFilterChange(value: any): void {
    this.selectedFilter.set(value);
    this.loadProducts();
  }

  openFilters(): void {
    console.log('Abrir filtros avanzados');
  }

  addProduct(): void {
    console.log('Ir a formulario crear producto');
  }

  editProduct(producto: Producto): void {
    console.log('Editar producto', producto.id);
  }

  getStockClass(stock: number): string {
    return stock <= 5 ? 'warning' : '';
  }

  get filteredProducts(): Producto[] {
    return this.productos();
  }
}
