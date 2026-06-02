import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
  checkmarkCircleOutline,
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
    FormsModule,
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
  @ViewChild('filtersModal') filtersModal!: IonModal;

  // Señales para reactividad
  search = signal('');
  selectedFilter = signal<'all' | 'active' | 'inactive'>('all');
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  isLoading = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;
  imagenPreview = signal<string | null>(null);
  isAdmin = signal(false);

  // Filtros avanzados
  filtrosAvanzados = {
    search: '',
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    minStock: null as number | null,
    status: null as 'active' | 'inactive' | null,
  };

  // Formulario reactivo
  productForm: FormGroup;

  // Inyección de servicios
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
      checkmarkCircleOutline,
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

  // =================== CARGAR DATOS ===================
  cargarProductos() {
    this.isLoading.set(true);

    // Construir filtros combinando segmento y filtros avanzados
    let isActive: boolean | undefined;
    if (this.selectedFilter() === 'active') isActive = true;
    else if (this.selectedFilter() === 'inactive') isActive = false;

    // Si hay filtro de estado en avanzados, sobreescribe
    if (this.filtrosAvanzados.status === 'active') isActive = true;
    else if (this.filtrosAvanzados.status === 'inactive') isActive = false;

    // Aquí deberías ampliar tu servicio para aceptar más filtros
    // Por ahora enviamos solo los básicos
    this.productosApi
      .listar({
        search: this.filtrosAvanzados.search || this.search(),
        isActive,
        categoryId: this.filtrosAvanzados.categoryId || undefined,
      })
      .subscribe({
        next: (data) => {
          // Aplicar filtros adicionales en cliente (precio, stock mínimo)
          let filtered = data;
          if (this.filtrosAvanzados.minPrice !== null) {
            filtered = filtered.filter(
              (p) => p.price >= this.filtrosAvanzados.minPrice!,
            );
          }
          if (this.filtrosAvanzados.maxPrice !== null) {
            filtered = filtered.filter(
              (p) => p.price <= this.filtrosAvanzados.maxPrice!,
            );
          }
          if (this.filtrosAvanzados.minStock !== null) {
            filtered = filtered.filter(
              (p) => p.stock >= this.filtrosAvanzados.minStock!,
            );
          }
          this.productos.set(filtered);
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

  // =================== FILTROS ===================
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.filtrosAvanzados.search = value;
    this.cargarProductos();
  }

  onFilterChange(event: CustomEvent) {
    const value = event.detail.value as
      | 'all'
      | 'active'
      | 'inactive'
      | undefined;
    const newFilter = value || 'all';
    this.selectedFilter.set(newFilter);
    // Limpiar filtro de estado en avanzados para no duplicar
    if (newFilter !== 'all') this.filtrosAvanzados.status = null;
    this.cargarProductos();
  }

  openFiltersModal() {
    this.filtersModal.present();
  }

  closeFiltersModal() {
    this.filtersModal.dismiss();
  }

  applyFilters() {
    this.closeFiltersModal();
    // Reiniciar el segmento a "todos" porque aplicamos filtro personalizado
    this.selectedFilter.set('all');
    this.cargarProductos();
  }

  resetFilters() {
    this.filtrosAvanzados = {
      search: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      minStock: null,
      status: null,
    };
    this.search.set('');
    this.selectedFilter.set('all');
    this.cargarProductos();
    this.closeFiltersModal();
  }

  // =================== CRUD ===================
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

    this.isLoading.set(true);
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
          this.isLoading.set(false);
          this.productModal.dismiss();
          this.actualizarProductoEnLista(productoActualizado);
          this.mostrarExito('Producto actualizado correctamente');
        },
        error: (err) => {
          this.isLoading.set(false);
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
          this.isLoading.set(false);
          this.productModal.dismiss();
          this.productos.update((list) => [nuevoProducto, ...list]);
          this.mostrarExito('Producto creado exitosamente');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.mostrarError('Error al crear', err?.error?.message);
        },
      });
    }
  }

  async deleteProduct(producto: Producto) {
    if (!this.isAdmin()) return;
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

  // ✅ NUEVO: Activar producto (cambiar isActive a true)
  async activateProduct(producto: Producto) {
    if (!this.isAdmin()) return;
    const alert = await this.alertCtrl.create({
      header: 'Activar producto',
      message: `¿Deseas activar "${producto.name}" nuevamente?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Activar',
          handler: () => {
            this.isLoading.set(true);
            this.productosApi
              .actualizar(producto.id, { isActive: true })
              .subscribe({
                next: (productoActivado) => {
                  this.isLoading.set(false);
                  this.actualizarProductoEnLista(productoActivado);
                  this.mostrarExito('Producto activado correctamente');
                },
                error: (err) => {
                  this.isLoading.set(false);
                  this.mostrarError('Error al activar', err?.error?.message);
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

  getStockClass(stock: number): string {
    return stock <= (this.productForm?.get('stockMinimo')?.value || 5)
      ? 'warning'
      : '';
  }

  // =================== KPIs ===================
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

  // =================== NOTIFICACIONES ===================
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
  closeModal() {
    this.productModal.dismiss();
  }
}
