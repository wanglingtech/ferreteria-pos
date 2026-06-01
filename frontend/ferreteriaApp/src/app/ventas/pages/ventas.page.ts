import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import { cartOutline, searchOutline, trashOutline } from 'ionicons/icons';

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface CartItem extends Producto {
  cantidad: number;
}

@Component({
  selector: 'app-ventas-page',
  standalone: true,
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon],
})
export class VentasPage {
  clienteNombre = '';

  products: Producto[] = [];

  filteredProducts: Producto[] = [];

  cart: CartItem[] = [];

  constructor() {
    addIcons({
      searchOutline,
      trashOutline,
      cartOutline,
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    if (!value) {
      this.filteredProducts = [];
      return;
    }

    this.filteredProducts = this.products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(value) ||
        p.sku.toLowerCase().includes(value),
    );
  }

  addToCart(product: Producto): void {
    const existing = this.cart.find((x) => x.id === product.id);

    if (existing) {
      existing.cantidad++;
    } else {
      this.cart.push({
        ...product,
        cantidad: 1,
      });
    }

    this.filteredProducts = [];
  }

  updateQuantity(item: CartItem, event: Event): void {
    item.cantidad = Number((event.target as HTMLInputElement).value);
  }

  removeItem(id: number): void {
    this.cart = this.cart.filter((x) => x.id !== id);
  }

  get subtotal(): number {
    return this.cart.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0,
    );
  }

  get igv(): number {
    return Number((this.subtotal * 0.18).toFixed(2));
  }

  get total(): number {
    return Number((this.subtotal + this.igv).toFixed(2));
  }

  guardarVenta(): void {
    console.log('Guardar venta');
  }

  cobrarVenta(): void {
    console.log('Cobrar venta');
  }
}
