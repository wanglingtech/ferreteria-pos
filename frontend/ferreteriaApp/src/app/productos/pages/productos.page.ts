import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
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

interface ProductoViewModel {
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

    IonFab,
    IonFabButton,
  ],
})
export class ProductosPage {
  protected readonly search = signal('');

  protected readonly selectedFilter = signal<'all' | 'active' | 'inactive'>(
    'all',
  );

  /**
   * TEMPORAL
   * Luego se reemplaza por la respuesta del backend
   */
  protected readonly productos = signal<ProductoViewModel[]>([
    {
      id: 1,
      sku: 'TLD-001',
      nombre: 'Taladro Percutor Bosch',
      precio: 399.9,
      stock: 25,
      activo: true,
      imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c',
    },
    {
      id: 2,
      sku: 'MRT-015',
      nombre: 'Martillo Profesional',
      precio: 35,
      stock: 3,
      activo: true,
      imagenUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8',
    },
    {
      id: 3,
      sku: 'DST-020',
      nombre: 'Destornillador Industrial',
      precio: 12.5,
      stock: 0,
      activo: false,
      imagenUrl: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492',
    },
  ]);

  constructor() {
    addIcons({
      searchOutline,
      filterOutline,
      createOutline,
      addOutline,
      cubeOutline,
    });
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.search.set(value);
  }

  protected onFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.selectedFilter.set(value);

    /**
     * Aquí después llamas al backend
     *
     * GET /productos?isActive=true
     * GET /productos?isActive=false
     */
  }

  protected openFilters(): void {
    console.log('Abrir filtros avanzados');
  }

  protected addProduct(): void {
    console.log('Abrir modal crear producto');
  }

  protected editProduct(producto: ProductoViewModel): void {
    console.log('Editar producto', producto);
  }

  protected getStockClass(stock: number): string {
    if (stock <= 5) {
      return 'warning';
    }

    return 'success';
  }

  protected get filteredProducts(): ProductoViewModel[] {
    const search = this.search().toLowerCase().trim();

    const filter = this.selectedFilter();

    return this.productos().filter((producto) => {
      const matchSearch =
        producto.nombre.toLowerCase().includes(search) ||
        producto.sku.toLowerCase().includes(search);

      const matchFilter =
        filter === 'all'
          ? true
          : filter === 'active'
            ? producto.activo
            : !producto.activo;

      return matchSearch && matchFilter;
    });
  }
}
