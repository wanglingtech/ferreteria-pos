import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  cubeOutline,
  filterOutline,
  searchOutline,
  closeOutline,
  trashOutline,
  saveOutline,
} from 'ionicons/icons';

import { ProductosApiService } from '../services/productos-api.service';
import { CategoriasApiService } from '../services/categorias-api.service';
import {
  Producto,
  CreateProductoRequest,
  UpdateProductoRequest,
  Categoria,
} from '../interfaces/producto.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-productos-page',
  standalone: true,
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonInput,
    IonItem,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonText,
    IonSpinner,
  ],
})
export class ProductosPage implements OnInit {
  @ViewChild('productModal') productModal!: IonModal;

  // Señales
  search = signal('');
  selectedFilter = signal<'all' | 'active' | 'inactive'>('all');
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  isLoading = signal(false);
  isEditing = signal(false);
  formSubmitting = signal(false); // ✅ Agregado
  editingId: number | null = null;
  imagenPreview = signal<string | null>(null);
  isAdmin = signal(false);

  // Formulario
  productForm: FormGroup;

  // Servicios
  private productosApi = inject(ProductosApiService);
  private categoriasApi = inject(CategoriasApiService);
  private authSession = inject(AuthSessionService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private fb = inject(FormBuilder);

  constructor() {
    addIcons({
      searchOutline,
      filterOutline,
      createOutline,
      addOutline,
      cubeOutline,
      closeOutline,
      trashOutline,
      saveOutline,
    });

    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.minLength(2)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      categoriaId: [null],
      imagenUrl: [''],
    });
  }

  ngOnInit() {
    const user = this.authSession.getCurrentUser();
    this.isAdmin.set(user?.role === 'ADMIN');
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos() {
    this.isLoading.set(true);
    let isActive: boolean | undefined;
    if (this.selectedFilter() === 'active') isActive = true;
    else if (this.selectedFilter() === 'inactive') isActive = false;

    this.productosApi.listar({ search: this.search(), isActive }).subscribe({
      next: (data) => {
        this.productos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        this.mostrarError('Error al cargar productos', err?.error?.message);
      },
    });
  }

  cargarCategorias() {
    this.categoriasApi.listarActivas().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.warn('No se pudieron cargar categorías', err),
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.cargarProductos();
  }

  // ✅ CORREGIDO: acepta SegmentValue (string | number | undefined)
  onFilterChange(value: string | number | undefined) {
    const filterStr = String(value ?? 'all') as 'all' | 'active' | 'inactive';
    this.selectedFilter.set(filterStr);
    this.cargarProductos();
  }

  openFilters() {
    this.mostrarInfo('Filtros avanzados próximamente');
  }

  addProduct() {
    if (!this.isAdmin()) {
      this.mostrarError(
        'Acceso denegado',
        'Solo administradores pueden crear productos',
      );
      return;
    }
    this.isEditing.set(false);
    this.editingId = null;
    this.productForm.reset({
      sku: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      stockMinimo: 0,
      categoriaId: null,
      imagenUrl: '',
    });
    this.imagenPreview.set(null);
    this.productModal.present();
  }

  editProduct(producto: Producto) {
    if (!this.isAdmin()) {
      this.mostrarError(
        'Acceso denegado',
        'Solo administradores pueden editar productos',
      );
      return;
    }
    this.isEditing.set(true);
    this.editingId = producto.id;
    this.productForm.patchValue({
      sku: producto.sku,
      nombre: producto.name,
      descripcion: producto.description || '',
      precio: producto.price,
      stock: producto.stock,
      stockMinimo: producto.minStock,
      categoriaId: producto.categoryId || null,
      imagenUrl: producto.imageUrl || '',
    });
    this.imagenPreview.set(producto.imageUrl || null);
    this.productModal.present();
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.mostrarError(
        'Formulario inválido',
        'Por favor completa los campos requeridos correctamente',
      );
      return;
    }

    this.formSubmitting.set(true);
    const formValue = this.productForm.value;

    if (this.isEditing() && this.editingId) {
      const payload: UpdateProductoRequest = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion || undefined,
        precio: formValue.precio,
        stock: formValue.stock,
        stockMinimo: formValue.stockMinimo,
        categoriaId:
          formValue.categoriaId === null ? undefined : formValue.categoriaId,
        imagenUrl: formValue.imagenUrl || undefined,
      };
      this.productosApi.actualizar(this.editingId, payload).subscribe({
        next: (productoActualizado) => {
          this.formSubmitting.set(false);
          this.productModal.dismiss();
          this.actualizarProductoEnLista(productoActualizado);
          this.mostrarExito('Producto actualizado correctamente');
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.mostrarError('Error al actualizar', err?.error?.message);
        },
      });
    } else {
      const payload: CreateProductoRequest = {
        sku: formValue.sku,
        nombre: formValue.nombre,
        descripcion: formValue.descripcion || undefined,
        precio: formValue.precio,
        stock: formValue.stock,
        stockMinimo: formValue.stockMinimo,
        categoriaId:
          formValue.categoriaId === null ? undefined : formValue.categoriaId,
        imagenUrl: formValue.imagenUrl || undefined,
      };
      this.productosApi.crear(payload).subscribe({
        next: (nuevoProducto) => {
          this.formSubmitting.set(false);
          this.productModal.dismiss();
          this.productos.update((list) => [nuevoProducto, ...list]);
          this.mostrarExito('Producto creado exitosamente');
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.mostrarError('Error al crear', err?.error?.message);
        },
      });
    }
  }

  async deleteProduct(producto: Producto) {
    if (!this.isAdmin()) {
      this.mostrarError(
        'Acceso denegado',
        'Solo administradores pueden eliminar productos',
      );
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar "${producto.name}"? Se desactivará.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.isLoading.set(true);
            this.productosApi.eliminar(producto.id).subscribe({
              next: (productoEliminado) => {
                this.isLoading.set(false);
                this.actualizarProductoEnLista(productoEliminado);
                this.mostrarExito('Producto desactivado');
              },
              error: (err) => {
                this.isLoading.set(false);
                this.mostrarError('Error al eliminar', err?.error?.message);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  actualizarProductoEnLista(productoActualizado: Producto) {
    this.productos.update((list) =>
      list.map((p) =>
        p.id === productoActualizado.id ? productoActualizado : p,
      ),
    );
  }

  onImagenUrlChange(url: string) {
    this.imagenPreview.set(url);
  }

  getStockClass(stock: number): string {
    const minStock = this.productForm?.get('stockMinimo')?.value || 5;
    return stock <= minStock ? 'warning' : '';
  }

  // KPIs
  get totalProductos(): number {
    return this.productos().length;
  }

  get activos(): number {
    return this.productos().filter((p) => p.isActive).length;
  }

  get bajoStock(): number {
    return this.productos().filter((p) => p.stock <= p.minStock).length;
  }

  get filteredProducts(): Producto[] {
    return this.productos();
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

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }

  private async mostrarInfo(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'primary',
    });
    await toast.present();
  }

  closeModal() {
    this.productModal.dismiss();
  }
}
