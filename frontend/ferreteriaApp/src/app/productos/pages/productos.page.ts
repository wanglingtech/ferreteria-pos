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

  loadProducts(): void {
    const params: any = {
      search: this.search(),
      status: this.selectedFilter(),
    };

    this.http.get<Producto[]>(this.API_URL, { params }).subscribe({
      next: (data) => this.productos.set(data),
      error: (err) => console.error(err),
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
    console.log('filters');
  }

  addProduct(): void {
    console.log('add product');
  }

  editProduct(producto: Producto): void {
    console.log('edit', producto.id);
  }

  getStockClass(stock: number): string {
    return stock <= 5 ? 'warning' : '';
  }

  /* KPIS REACTIVOS */
  get totalProductos(): number {
    return this.productos().length;
  }

  get activos(): number {
    return this.productos().filter((p) => p.activo).length;
  }

  get bajoStock(): number {
    return this.productos().filter((p) => p.stock <= 5).length;
  }

  get filteredProducts(): Producto[] {
    return this.productos();
  }
}
