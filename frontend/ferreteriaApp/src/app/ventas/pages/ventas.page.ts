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
import { PdfGeneratorService } from '../services/pdf-generator.service';

// Librerías necesarias para el QR y PDF (ya instaladas)
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    // Eliminados IonItem, IonLabel, IonInput, IonText (no se usan en el HTML)
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
  ventaConfirmada: Venta | null = null;

  private productosApi = inject(ProductosApiService);
  private ventasApi = inject(VentasApiService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfGenerator = inject(PdfGeneratorService);

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

  async guardarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }
    this.ventaConfirmada = null;
    this.resumenModal.present();
  }

  async cobrarVenta() {
    await this.guardarVenta();
  }

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
    this.alertCtrl
      .create({
        header: 'Venta completada',
        message: `Venta N° ${venta.code} registrada con éxito. ¿Qué deseas hacer?`,
        buttons: [
          { text: 'Imprimir', handler: () => this.imprimirTicket(venta) },
          { text: 'Compartir', handler: () => this.compartirVenta(venta) },
          { text: 'Cerrar', role: 'cancel' },
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

  // =================== PDF Y COMPARTIR ===================
  imprimirTicket(venta: Venta) {
    this.ventaConfirmada = venta;
    // Datos para el QR (puedes cambiar la URL)
    const qrData = `${window.location.origin}/ventas/detalle/${venta.id}`;
    setTimeout(() => {
      this.pdfGenerator.generateTicketPdf(
        'ticket-content',
        `ticket-${venta.code}.pdf`,
        qrData,
      );
    }, 200);
  }

  async compartirVenta(venta: Venta) {
    this.ventaConfirmada = venta;
    const qrData = `${window.location.origin}/ventas/detalle/${venta.id}`;
    const pdfBlob = await this.generarPdfBlob(venta, qrData);

    if (!pdfBlob) {
      this.mostrarError('Error', 'No se pudo generar el PDF para compartir');
      return;
    }

    const file = new File([pdfBlob], `factura-${venta.code}.pdf`, {
      type: 'application/pdf',
    });

    // Verificar si el navegador permite compartir archivos
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Factura ${venta.code}`,
          text: `Total: S/ ${venta.total} - Cliente: ${venta.customerName}`,
          files: [file],
        });
        this.mostrarExito('Factura compartida exitosamente');
      } catch (err: any) {
        console.error('Error al compartir:', err);
        // Mostrar mensaje de error más amigable
        const errorMsg =
          err?.message || 'El usuario canceló o hubo un problema';
        this.mostrarError('No se pudo compartir', errorMsg);
      }
    } else {
      // Fallback: copiar enlace y sugerir descarga
      navigator.clipboard.writeText(qrData);
      this.mostrarExito(
        'Enlace copiado al portapapeles. Usa "Imprimir" para descargar el PDF.',
      );
    }
  }

  // Genera un blob del PDF a partir del elemento oculto ticket-content
  private async generarPdfBlob(
    venta: Venta,
    qrData: string,
  ): Promise<Blob | null> {
    this.ventaConfirmada = venta;
    const element = document.getElementById('ticket-content');
    if (!element) return null;

    // Clonar para no interferir con la vista
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    try {
      // Generar QR y agregarlo al clon
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, { width: 150, margin: 2 });
      const qrImg = document.createElement('img');
      qrImg.src = qrCanvas.toDataURL();
      qrImg.style.width = '100px';
      qrImg.style.marginTop = '15px';
      qrImg.style.display = 'block';
      qrImg.style.marginLeft = 'auto';
      clone.appendChild(qrImg);

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      // Formato ticket (80mm de ancho)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const blob = pdf.output('blob');
      return blob;
    } catch (error) {
      console.error('Error generando blob PDF:', error);
      return null;
    } finally {
      document.body.removeChild(clone);
    }
  }

  cancelarVenta() {
    this.resumenModal.dismiss();
    this.mostrarExito('Venta cancelada');
  }

  // =================== NOTIFICACIONES ===================
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
