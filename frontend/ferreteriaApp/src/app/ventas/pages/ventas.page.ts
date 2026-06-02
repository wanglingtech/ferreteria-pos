import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  searchOutline,
  trashOutline,
  checkmarkCircleOutline,
  printOutline,
  shareSocialOutline,
  closeOutline,
} from 'ionicons/icons';

import { ProductosApiService } from '../../productos/services/productos-api.service';
import { VentasApiService } from '../services/ventas-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  ProductoParaVenta,
  CartItem,
  CreateVentaRequest,
  Venta,
} from '../interfaces/venta.interface';

@Component({
  selector: 'app-ventas-page',
  standalone: true,
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
  ],
})
export class VentasPage implements OnInit {
  @ViewChild('resumenModal') resumenModal!: IonModal;

  clienteNombre = '';
  searchTerm = '';
  productos = signal<ProductoParaVenta[]>([]);
  filteredProducts = signal<ProductoParaVenta[]>([]);
  cart = signal<CartItem[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);
  ventaConfirmada: Venta | null = null; // para mostrar en el modal

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
      printOutline,
      shareSocialOutline,
      closeOutline,
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
        const mapped = data.map((p) => ({
          id: p.id,
          sku: p.sku,
          nombre: p.name,
          precio: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl || 'assets/default-product.png',
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

  // Guardar: abre resumen para confirmar
  async guardarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }
    // Mostrar modal de resumen (aún sin confirmar)
    this.ventaConfirmada = null;
    this.resumenModal.present();
  }

  // Cobrar: mismo flujo pero con enfoque de pago (podríamos cambiar título del botón)
  async cobrarVenta() {
    await this.guardarVenta(); // misma lógica, pero el modal indicará "Cobrar"
  }

  // Confirmar la venta (desde el modal)
  async confirmarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'No hay productos para vender');
      return;
    }

    const payload: CreateVentaRequest = {
      clienteNombre: this.clienteNombre.trim(),
      items: this.cart().map((item) => ({
        productoId: item.id,
        cantidad: item.cantidad,
      })),
    };

    this.isLoading.set(true);
    this.ventasApi.crear(payload).subscribe({
      next: (venta) => {
        this.isLoading.set(false);
        this.ventaConfirmada = venta;
        this.mostrarExito('Venta registrada exitosamente');
        this.limpiarCarrito();
        // Aquí podrías cerrar el modal y mostrar otro de éxito, pero ya tenemos la ventaConfirmada
        // Podemos mantener el modal abierto y cambiar su contenido para mostrar el ticket.
        // Por simplicidad, cerramos y mostramos un toast con opción de imprimir.
        this.resumenModal.dismiss();
        this.mostrarOpcionesPostVenta(venta);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error al registrar venta', err?.error?.message);
      },
    });
  }

  private mostrarOpcionesPostVenta(venta: Venta) {
    // Opcional: alerta con opciones de imprimir/compartir
    this.alertCtrl
      .create({
        header: 'Venta completada',
        message: `Venta N° ${venta.code} registrada con éxito. ¿Qué deseas hacer?`,
        buttons: [
          {
            text: 'Imprimir',
            handler: () => this.imprimirTicket(venta),
          },
          {
            text: 'Compartir',
            handler: () => this.compartirVenta(venta),
          },
          {
            text: 'Cerrar',
            role: 'cancel',
          },
        ],
      })
      .then((alert) => alert.present());
  }

  private validarCliente(): boolean {
    if (!this.clienteNombre.trim()) {
      this.mostrarError('Cliente requerido', 'Ingresa el nombre del cliente');
      return false;
    }
    return true;
  }

  limpiarCarrito() {
    this.cart.set([]);
    this.clienteNombre = '';
  }

  imprimirTicket(venta: Venta) {
    // Implementación simple: abrir ventana de impresión con contenido formateado
    const contenido = this.generarHTMLTicket(venta);
    const ventana = window.open('', '_blank');
    ventana?.document.write(contenido);
    ventana?.print();
    ventana?.close();
  }

  compartirVenta(venta: Venta) {
    // Simular compartir (puedes usar Web Share API si está disponible)
    const texto = `Venta ${venta.code} - Total: S/ ${venta.total} - Cliente: ${venta.customerName}`;
    if (navigator.share) {
      navigator.share({
        title: 'Detalle de venta',
        text: texto,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(texto);
      this.mostrarExito('Detalle copiado al portapapeles');
    }
  }

  private generarHTMLTicket(venta: Venta): string {
    const itemsHtml = venta.items
      .map(
        (item) => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>S/ ${item.unitPrice.toFixed(2)}</td>
        <td>S/ ${item.lineTotal.toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Venta ${venta.code}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0a1a5c; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-size: 1.2em; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Ferretería July</h1>
        <p><strong>Venta N°:</strong> ${venta.code}</p>
        <p><strong>Fecha:</strong> ${new Date(venta.createdAt).toLocaleString()}</p>
        <p><strong>Vendedor:</strong> ${venta.seller.fullName}</p>
        <p><strong>Cliente:</strong> ${venta.customerName || 'Consumidor final'}</p>
        <table>
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">Subtotal: S/ ${venta.subtotal.toFixed(2)}</div>
        <div class="total">IGV (18%): S/ ${venta.igv.toFixed(2)}</div>
        <div class="total">Total: S/ ${venta.total.toFixed(2)}</div>
        <hr />
        <p>¡Gracias por su compra!</p>
      </body>
      </html>
    `;
  }

  // Cancelar desde el modal
  cancelarVenta() {
    this.resumenModal.dismiss();
    this.mostrarExito('Venta cancelada');
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
