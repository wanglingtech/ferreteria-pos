import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  searchOutline,
  trashOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

import { ProductosApiService } from '../../productos/services/productos-api.service';
import { VentasApiService } from '../services/ventas-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  ProductoParaVenta,
  CartItem,
  CreateVentaRequest,
} from '../interfaces/venta.interface';

@Component({
  selector: 'app-ventas-page',
  standalone: true,
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon],
})
export class VentasPage implements OnInit {
  clienteNombre = '';
  searchTerm = '';
  productos = signal<ProductoParaVenta[]>([]);
  filteredProducts = signal<ProductoParaVenta[]>([]);
  cart = signal<CartItem[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);

  private productosApi = inject(ProductosApiService);
  private ventasApi = inject(VentasApiService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({
      searchOutline,
      trashOutline,
      cartOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    const user = this.authSession.getCurrentUser();
    this.isAdmin.set(user?.role === 'ADMIN');
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosApi.listar({ isActive: true }).subscribe({
      next: (data) => {
        // Mapear a formato local
        const mapped = data.map((p) => ({
          id: p.id,
          sku: p.sku,
          nombre: p.name,
          precio: p.price,
          stock: p.stock,
        }));
        this.productos.set(mapped);
      },
      error: (err) =>
        this.mostrarError('Error cargando productos', err?.error?.message),
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = value;
    if (!value.trim()) {
      this.filteredProducts.set([]);
      return;
    }
    const filtered = this.productos().filter(
      (p) =>
        p.nombre.toLowerCase().includes(value) ||
        p.sku.toLowerCase().includes(value),
    );
    this.filteredProducts.set(filtered);
  }

  addToCart(producto: ProductoParaVenta) {
    if (producto.stock <= 0) {
      this.mostrarError(
        'Sin stock',
        `El producto ${producto.nombre} no tiene stock disponible`,
      );
      return;
    }
    const existing = this.cart().find((item) => item.id === producto.id);
    if (existing) {
      if (existing.cantidad + 1 > existing.stock) {
        this.mostrarError(
          'Límite alcanzado',
          `Solo hay ${existing.stock} unidades disponibles`,
        );
        return;
      }
      existing.cantidad++;
      this.cart.set([...this.cart()]);
    } else {
      this.cart.set([...this.cart(), { ...producto, cantidad: 1 }]);
    }
    this.filteredProducts.set([]);
    this.searchTerm = '';
    this.mostrarExito('Producto agregado');
  }

  updateQuantity(item: CartItem, event: Event) {
    const newQty = Number((event.target as HTMLInputElement).value);
    if (isNaN(newQty) || newQty < 1) {
      item.cantidad = 1;
    } else if (newQty > item.stock) {
      this.mostrarError('Stock insuficiente', `Máximo ${item.stock} unidades`);
      item.cantidad = item.stock;
    } else {
      item.cantidad = newQty;
    }
    this.cart.set([...this.cart()]);
  }

  removeItem(id: number) {
    this.cart.set(this.cart().filter((item) => item.id !== id));
  }

  get subtotal(): number {
    return this.cart().reduce(
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

  async guardarVenta() {
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de guardar');
      return;
    }
    await this.procesarVenta(false);
  }

  async cobrarVenta() {
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de cobrar');
      return;
    }
    await this.procesarVenta(true);
  }

  private async procesarVenta(esCobro: boolean) {
    const payload: CreateVentaRequest = {
      clienteNombre: this.clienteNombre.trim() || undefined,
      items: this.cart().map((item) => ({
        productoId: item.id,
        cantidad: item.cantidad,
      })),
    };

    this.isLoading.set(true);
    this.ventasApi.crear(payload).subscribe({
      next: (venta) => {
        this.isLoading.set(false);
        const mensaje = esCobro
          ? 'Venta cobrada exitosamente'
          : 'Venta guardada como pendiente';
        this.mostrarExito(mensaje);
        this.limpiarCarrito();
        if (esCobro) {
          this.imprimirTicket(venta);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error al registrar venta', err?.error?.message);
      },
    });
  }

  limpiarCarrito() {
    this.cart.set([]);
    this.clienteNombre = '';
  }

  imprimirTicket(venta: any) {
    // Aquí puedes implementar impresión o mostrar resumen
    console.log('Ticket de venta:', venta);
    // Podrías abrir un modal con el detalle o redirigir a una página de comprobante
  }

  private async mostrarError(titulo: string, mensaje?: string) {
    const toast = await this.toastCtrl.create({
      header: titulo,
      message: mensaje || 'Ocurrió un error',
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }
}
