// ============================================================
// MÓDULO: VentasPage
// Punto de Venta (POS) - Permite buscar productos, agregar al carrito,
// gestionar cantidades, validar cliente y registrar ventas.
// ============================================================

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

// Importaciones para debounce y manejo de destrucción
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
  // ============================================================
  // 1. REFERENCIAS A ELEMENTOS DEL DOM
  // ============================================================
  @ViewChild('resumenModal') resumenModal!: IonModal;

  // ============================================================
  // 2. SEÑALES (estado reactivo)
  // ============================================================

  /** Nombre del cliente (obligatorio) */
  clienteNombre = signal<string>('');

  /** Término de búsqueda actual (se enlaza con el input) */
  searchTerm = '';

  /** Lista completa de productos disponibles (con stock > 0) */
  productos = signal<ProductoParaVenta[]>([]);

  /** Resultados filtrados de la búsqueda */
  filteredProducts = signal<ProductoParaVenta[]>([]);

  /** Carrito de compras (productos seleccionados con cantidades) */
  cart = signal<CartItem[]>([]);

  /** Indica si se está procesando una operación (guardando venta) */
  isLoading = signal(false);

  /** Indica si el usuario es administrador (para permisos) */
  isAdmin = signal(false);

  /** Última venta registrada (se usa para generar ticket) */
  ventaConfirmada: Venta | null = null;

  /** Mensaje de error para el campo cliente */
  clienteError = signal<string>('');

  // ============================================================
  // 3. DEBOUNCE PARA BÚSQUEDA
  // ============================================================

  /** Subject que emite el término de búsqueda para aplicar debounce */
  private searchSubject = new Subject<string>();

  /** Subject para limpiar suscripciones al destruir el componente */
  private destroy$ = new Subject<void>();

  // ============================================================
  // 4. COMPUTED (valores derivados)
  // ============================================================

  /**
   * Indica si el formulario es válido (cliente con nombre válido y carrito no vacío).
   * Se actualiza automáticamente cuando cambian las señales dependientes.
   */
  isFormValid = computed(() => {
    const nombre = this.clienteNombre().trim();
    return nombre.length > 0 && !this.clienteError() && this.cart().length > 0;
  });

  // ============================================================
  // 5. INYECCIÓN DE DEPENDENCIAS
  // ============================================================

  private productosApi = inject(ProductosApiService);
  private ventasApi = inject(VentasApiService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private pdfGenerator = inject(PdfGeneratorService);

  // ============================================================
  // 6. CONSTRUCTOR
  // ============================================================

  constructor() {
    // Registrar iconos de Ionic
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

    // Efecto que se ejecuta automáticamente cuando cambia el nombre del cliente
    // para validar en tiempo real y mostrar errores.
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
  // 7. CICLO DE VIDA
  // ============================================================

  ngOnInit() {
    // Obtener usuario actual para saber si es admin
    const user = this.authSession.getCurrentUser();
    this.isAdmin.set(user?.role === 'ADMIN');

    // Cargar productos disponibles
    this.cargarProductos();

    // Mensaje de error inicial para el cliente
    this.clienteError.set('El nombre del cliente es obligatorio');

    // Configurar debounce para la búsqueda de productos (filtrado local)
    // - debounceTime(300): espera 300 ms de inactividad para ejecutar el filtro.
    // - distinctUntilChanged(): solo emite si el valor cambió.
    // - takeUntil(this.destroy$): se desuscribe al destruir el componente.
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filtrarProductos(term);
      });
  }

  /**
   * Al destruir el componente, limpiamos las suscripciones para evitar memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // 8. CARGA DE PRODUCTOS Y BÚSQUEDA
  // ============================================================

  /**
   * Obtiene los productos activos desde el backend y los almacena en la señal `productos`.
   * También mapea los campos para adaptarlos al frontend.
   */
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
   * Emite el valor al Subject `searchSubject` para aplicar el debounce.
   * @param event - Evento del input
   */
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value; // Guardamos para enlace en el template si se usa
    this.searchSubject.next(value);
  }

  /**
   * Filtra los productos localmente según el término de búsqueda (nombre o SKU).
   * Se ejecuta después del debounce.
   * @param term - Término de búsqueda
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
  // 9. GESTIÓN DEL CARRITO
  // ============================================================

  /**
   * Agrega un producto al carrito.
   * Si ya existe, incrementa la cantidad (respetando el stock máximo).
   * Si el producto no tiene stock, muestra un error.
   * @param producto - Producto a agregar
   */
  addToCart(producto: ProductoParaVenta) {
    // Validar que el producto tenga stock
    if (producto.stock <= 0) {
      this.mostrarError(
        'Sin stock',
        `El producto ${producto.nombre} no tiene stock disponible`,
      );
      return;
    }

    // Buscar si el producto ya está en el carrito
    const existing = this.cart().find((item) => item.id === producto.id);

    if (existing) {
      // Verificar que no supere el stock disponible
      if (existing.cantidad + 1 > existing.stock) {
        this.mostrarError(
          'Límite alcanzado',
          `Solo hay ${existing.stock} unidades disponibles de ${existing.nombre}`,
        );
        return;
      }
      // Incrementar cantidad
      existing.cantidad++;
      this.cart.set([...this.cart()]); // Forzar actualización de la señal
    } else {
      // Agregar nuevo producto con cantidad 1
      this.cart.set([...this.cart(), { ...producto, cantidad: 1 }]);
    }

    // Limpiar resultados de búsqueda y campo de búsqueda
    this.filteredProducts.set([]);
    this.searchTerm = '';
    this.mostrarExito('Producto agregado');
  }

  /**
   * Actualiza la cantidad de un producto en el carrito.
   * Valida que el valor sea un número positivo y no supere el stock.
   * Si el valor supera el stock, se ajusta al máximo y se muestra un error.
   * @param item - Ítem del carrito a modificar
   * @param event - Evento del input (contiene el nuevo valor)
   */
  updateQuantity(item: CartItem, event: Event) {
    const newQty = Number((event.target as HTMLInputElement).value);

    // Si no es un número válido o es menor que 1, se establece a 1
    if (isNaN(newQty) || newQty < 1) {
      item.cantidad = 1;
      this.cart.set([...this.cart()]);
      return;
    }

    // Si la cantidad supera el stock disponible, se ajusta al stock y se muestra error
    if (newQty > item.stock) {
      this.mostrarError(
        'Stock insuficiente',
        `La cantidad máxima disponible para "${item.nombre}" es ${item.stock} unidades. Se ajustará a ese valor.`,
      );
      item.cantidad = item.stock;
    } else {
      item.cantidad = newQty;
    }

    // Actualizar la señal del carrito para que la vista se refresque
    this.cart.set([...this.cart()]);
  }

  /**
   * Elimina un producto del carrito por su ID.
   * @param id - ID del producto a eliminar
   */
  removeItem(id: number) {
    this.cart.set(this.cart().filter((item) => item.id !== id));
  }

  // ============================================================
  // 10. CÁLCULOS DE TOTALES
  // ============================================================

  /**
   * Calcula el subtotal sumando (precio * cantidad) de cada ítem.
   */
  get subtotal(): number {
    return this.cart().reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0,
    );
  }

  /**
   * Calcula el IGV (18% del subtotal).
   */
  get igv(): number {
    return Number((this.subtotal * 0.18).toFixed(2));
  }

  /**
   * Calcula el total (subtotal + IGV).
   */
  get total(): number {
    return Number((this.subtotal + this.igv).toFixed(2));
  }

  // ============================================================
  // 11. VALIDACIÓN DE CLIENTE
  // ============================================================

  /**
   * Valida el nombre del cliente según reglas estrictas:
   * - Mínimo 3 caracteres, máximo 80.
   * - Al menos dos palabras (nombre y apellido).
   * - Solo letras, espacios, apóstrofes, guiones y puntos.
   * - Sin caracteres repetidos como "..", "--", "''".
   * @returns true si es válido, false en caso contrario.
   */
  validarCliente() {
    const nombre = this.clienteNombre().trim();

    // Validaciones básicas
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

    // Regex que exige al menos dos palabras (cada una con al menos una letra)
    const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:[\s\-'\.][A-Za-zÁÉÍÓÚÑáéíóúñ]+)+$/;
    if (!regex.test(nombre)) {
      this.clienteError.set(
        "Ingrese al menos dos palabras (nombre y apellido). Use solo letras, espacios, guiones, apóstrofes o puntos. Ej: Juan Pérez, Mª José, D'Angelo.",
      );
      return false;
    }

    // No permitir caracteres repetidos consecutivos como "..", "--", "''"
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

    // Todo bien
    this.clienteError.set('');
    return true;
  }

  // ============================================================
  // 12. MÉTODOS DE VENTA (GUARDAR / COBRAR)
  // ============================================================

  /** Variable para saber si la venta es guardar o cobrar */
  private tipoVentaPendiente: 'guardar' | 'cobrar' = 'guardar';

  /**
   * Guarda la venta (sin cobrar). Presenta el modal de resumen.
   */
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

  /**
   * Cobra la venta (guarda y muestra opciones de impresión/compartir).
   * Presenta el modal de resumen.
   */
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

  /**
   * Confirma la venta (envía al backend).
   * Después de registrar, limpia el carrito y recarga productos para actualizar stock.
   */
  async confirmarVenta() {
    // Validaciones antes de confirmar
    if (!this.validarCliente()) return;
    if (this.cart().length === 0) {
      this.mostrarError('Carrito vacío', 'No hay productos para vender');
      return;
    }

    // Preparar payload para el backend
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

        // Limpiar carrito y recargar productos (para actualizar stock)
        this.limpiarCarrito();
        this.cargarProductos(); // <-- Actualiza stock en tiempo real

        // Cerrar modal de resumen
        this.resumenModal.dismiss();

        // Mostrar opciones según el tipo de venta
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

  /**
   * Muestra opciones después de guardar una venta (compartir o cerrar).
   * @param venta - Venta registrada
   */
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

  /**
   * Muestra opciones después de cobrar una venta (imprimir o cerrar).
   * @param venta - Venta registrada
   */
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

  /**
   * Limpia el carrito y el campo de cliente, reiniciando el error.
   */
  limpiarCarrito() {
    this.cart.set([]);
    this.clienteNombre.set('');
    this.clienteError.set('El nombre del cliente es obligatorio');
  }

  // ============================================================
  // 13. IMPRESIÓN Y COMPARTIR TICKET
  // ============================================================

  /**
   * Genera e imprime el ticket de la venta en formato PDF.
   * @param venta - Venta registrada
   */
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

  /**
   * Comparte la factura de la venta (PDF) mediante la API Web Share.
   * Si no es compatible, copia un enlace al portapapeles.
   * @param venta - Venta registrada
   */
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

    // Usar Web Share API si está disponible
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
      // Fallback: copiar enlace al portapapeles
      navigator.clipboard.writeText(qrData);
      this.mostrarExito(
        'Enlace copiado al portapapeles. Usa "Imprimir" para descargar el PDF.',
      );
    }
  }

  /**
   * Genera un blob de PDF a partir de los datos de la venta y un código QR.
   * @param venta - Venta registrada
   * @param qrData - Datos para el código QR
   * @returns Blob del PDF o null si falla
   */
  private async generarPdfBlob(
    venta: Venta,
    qrData: string,
  ): Promise<Blob | null> {
    this.ventaConfirmada = venta;
    const element = document.getElementById('ticket-content');
    if (!element) return null;

    // Clonar el elemento para no modificar el DOM visible
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    try {
      // Generar código QR
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, { width: 150, margin: 2 });
      const qrImg = document.createElement('img');
      qrImg.src = qrCanvas.toDataURL();
      qrImg.style.width = '100px';
      qrImg.style.marginTop = '15px';
      qrImg.style.display = 'block';
      qrImg.style.marginLeft = 'auto';
      clone.appendChild(qrImg);

      // Convertir a imagen usando html2canvas
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');

      // Crear PDF en formato ticket (80mm de ancho)
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

  /**
   * Cancela la venta (cierra el modal de resumen).
   */
  cancelarVenta() {
    this.resumenModal.dismiss();
    this.mostrarExito('Venta cancelada');
  }

  // ============================================================
  // 14. TOASTS (notificaciones al usuario)
  // ============================================================

  /**
   * Muestra un toast de error.
   * @param titulo - Título del error
   * @param mensaje - Mensaje detallado (opcional)
   */
  private async mostrarError(titulo: string, mensaje?: string) {
    const toast = await this.toastCtrl.create({
      header: titulo,
      message: mensaje || 'Ocurrió un error',
      duration: 4000, // 4 segundos
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  /**
   * Muestra un toast de éxito.
   * @param mensaje - Mensaje de éxito
   */
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
