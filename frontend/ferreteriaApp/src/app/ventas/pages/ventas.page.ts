import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
} from '@angular/core';
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
  alertCircleOutline,
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

// ✅ Importamos Subject y operadores RxJS
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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
  ],
})
export class VentasPage implements OnInit, OnDestroy {
  @ViewChild('resumenModal') resumenModal!: IonModal;

  // ============================================================
  // 1. SEÑALES
  // ============================================================
  clienteNombre = signal<string>('');
  searchTerm = ''; // solo para almacenar el valor actual, lo usamos en el input
  productos = signal<ProductoParaVenta[]>([]);
  filteredProducts = signal<ProductoParaVenta[]>([]);
  cart = signal<CartItem[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);
  ventaConfirmada: Venta | null = null;
  clienteError = signal<string>('');

  // ============================================================
  // 2. DEBOUNCE PARA BÚSQUEDA
  // ============================================================
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ============================================================
  // 3. COMPUTED
  // ============================================================
  isFormValid = computed(() => {
    const nombre = this.clienteNombre().trim();
    return nombre.length > 0 && !this.clienteError() && this.cart().length > 0;
  });

  // ============================================================
  // 4. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
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
      alertCircleOutline,
    });

    // Efecto para validar cliente automáticamente
    effect(() => {
      const nombre = this.clienteNombre();
      if (nombre.length > 0) {
        this.validarCliente();
      } else {
        this.clienteError.set('El nombre del cliente es obligatorio');
      }
    });
  }

  // ============================================================
  // 5. CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    const user = this.authSession.getCurrentUser();
    this.isAdmin.set(user?.role === 'ADMIN');
    this.cargarProductos();
    this.clienteError.set('El nombre del cliente es obligatorio');

    // ✅ Configurar debounce para la búsqueda de productos
    // En Ventas la búsqueda es local (no llama al backend), pero aplicamos debounce
    // para no saturar el filtrado si la lista es grande (se ejecuta en cada letra)
    this.searchSubject
      .pipe(
        debounceTime(300), // un poco más rápido que en Productos porque es local
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((term) => {
        this.filtrarProductos(term);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // 6. CARGA DE PRODUCTOS Y BÚSQUEDA
  // ============================================================
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

  /**
   * Evento que se dispara en cada input del buscador.
   * Emitimos el valor al Subject para que el debounce actúe.
   */
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value; // guardamos para enlazar con ngModel si se usa
    this.searchSubject.next(value);
  }

  /**
   * Filtrado local de productos (se ejecuta después del debounce)
   */
  private filtrarProductos(term: string) {
    if (!term.trim()) {
      this.filteredProducts.set([]);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = this.productos().filter(
      (p) =>
        p.nombre.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower),
    );
    this.filteredProducts.set(filtered);
  }

  // ============================================================
  // 7. CARRITO (sin cambios, pero incluidos)
  // ============================================================
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
    // Limpiar resultados de búsqueda
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

  // ============================================================
  // 8. VALIDACIÓN DE CLIENTE
  // ============================================================
  validarCliente() {
    const nombre = this.clienteNombre().trim();
    if (nombre.length === 0) {
      this.clienteError.set('El nombre del cliente es obligatorio');
      return false;
    }
    if (nombre.length < 3) {
      this.clienteError.set('Mínimo 3 caracteres (ej: Ana)');
      return false;
    }
    if (nombre.length > 80) {
      this.clienteError.set('Máximo 80 caracteres');
      return false;
    }
    const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:[\s\-'\.][A-Za-zÁÉÍÓÚÑáéíóúñ]+)+$/;
    if (!regex.test(nombre)) {
      this.clienteError.set(
        "Ingrese al menos dos palabras (nombre y apellido). Use solo letras, espacios, guiones, apóstrofes o puntos. Ej: Juan Pérez, Mª José, D'Angelo.",
      );
      return false;
    }
    if (
      /(\.{2,})/.test(nombre) ||
      /(\-{2,})/.test(nombre) ||
      /(\'{2,})/.test(nombre)
    ) {
      this.clienteError.set(
        'No use caracteres repetidos como "..", "--" o \'\'\'. Use solo uno entre palabras.',
      );
      return false;
    }
    this.clienteError.set('');
    return true;
  }

  // ============================================================
  // 9. MÉTODOS DE VENTA
  // ============================================================
  private tipoVentaPendiente: 'guardar' | 'cobrar' = 'guardar';

  async guardarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }
    this.ventaConfirmada = null;
    this.resumenModal.present();
    this.tipoVentaPendiente = 'guardar';
  }

  async cobrarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'Agrega productos antes de continuar');
      return;
    }
    this.ventaConfirmada = null;
    this.resumenModal.present();
    this.tipoVentaPendiente = 'cobrar';
  }

  async confirmarVenta() {
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'No hay productos para vender');
      return;
    }

    const payload: CreateVentaRequest = {
      clienteNombre: this.clienteNombre().trim(),
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

        // ✅ Recargar productos para actualizar el stock en tiempo real
        this.cargarProductos();

        this.resumenModal.dismiss();

        if (this.tipoVentaPendiente === 'guardar') {
          this.mostrarOpcionesPostGuardar(venta);
        } else {
          this.mostrarOpcionesPostCobrar(venta);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.mostrarError('Error al registrar venta', err?.error?.message);
      },
    });
  }

  private mostrarOpcionesPostGuardar(venta: Venta) {
    this.alertCtrl
      .create({
        header: 'Venta registrada',
        message: `Venta N° ${venta.code} registrada con éxito.`,
        buttons: [
          { text: 'Compartir', handler: () => this.compartirVenta(venta) },
          { text: 'Cerrar', role: 'cancel' },
        ],
      })
      .then((alert) => alert.present());
  }

  private mostrarOpcionesPostCobrar(venta: Venta) {
    this.alertCtrl
      .create({
        header: 'Venta completada',
        message: `Venta N° ${venta.code} registrada con éxito. ¿Desea imprimir el comprobante?`,
        buttons: [
          { text: 'Imprimir', handler: () => this.imprimirTicket(venta) },
          { text: 'Cerrar', role: 'cancel' },
        ],
      })
      .then((alert) => alert.present());
  }

  limpiarCarrito() {
    this.cart.set([]);
    this.clienteNombre.set('');
    this.clienteError.set('El nombre del cliente es obligatorio');
  }

  imprimirTicket(venta: Venta) {
    this.ventaConfirmada = venta;
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
        this.mostrarError(
          'No se pudo compartir',
          err?.message || 'Error desconocido',
        );
      }
    } else {
      navigator.clipboard.writeText(qrData);
      this.mostrarExito(
        'Enlace copiado al portapapeles. Usa "Imprimir" para descargar el PDF.',
      );
    }
  }

  private async generarPdfBlob(
    venta: Venta,
    qrData: string,
  ): Promise<Blob | null> {
    this.ventaConfirmada = venta;
    const element = document.getElementById('ticket-content');
    if (!element) return null;
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);
    try {
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      return pdf.output('blob');
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

  // ============================================================
  // 10. TOASTS
  // ============================================================
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
