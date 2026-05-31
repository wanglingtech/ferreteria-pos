import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  ToastController,
  AlertController,
  IonSpinner,
  IonActionSheet,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  searchOutline,
  personAddOutline,
  peopleOutline,
  ellipsisVerticalOutline,
  closeOutline,
  checkmarkOutline,
  pencilOutline,
  trashOutline,
  lockOpenOutline,
  lockClosedOutline,
} from 'ionicons/icons';

import { UsuariosApiService } from '../services/usuarios-api.service';
import { Usuario, CreateUsuarioRequest } from '../interfaces/usuario.interface';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonText,
    IonSpinner,
    IonActionSheet,
  ],
})
export class UsuariosPage implements OnInit {
  @ViewChild('createModal') createModal!: IonModal;
  @ViewChild('actionSheet') actionSheet!: IonActionSheet;

  /**
   * Texto del buscador
   */
  protected search = '';

  /**
   * Usuarios obtenidos desde API
   */
  protected usuarios: Usuario[] = [];

  /**
   * Formulario para crear usuario
   */
  protected createUserForm: FormGroup;

  /**
   * Indicador de carga
   */
  protected isLoading = false;

  /**
   * Usuario seleccionado para acciones
   */
  protected selectedUser: Usuario | null = null;

  /**
   * Mostrar acción sheet
   */
  protected showActionSheet = false;

  constructor(
    private readonly usuariosApiService: UsuariosApiService,
    private readonly formBuilder: FormBuilder,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    addIcons({
      searchOutline,
      personAddOutline,
      peopleOutline,
      ellipsisVerticalOutline,
      closeOutline,
      checkmarkOutline,
      pencilOutline,
      trashOutline,
      lockOpenOutline,
      lockClosedOutline,
    });

    this.createUserForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['SELLER', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  /**
   * Cargar usuarios desde API
   */
  protected cargarUsuarios(): void {
    this.isLoading = true;
    this.usuariosApiService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.mostrarError('Error al cargar usuarios', error?.error?.message);
      },
    });
  }

  /**
   * Filtrado local en tiempo real
   */
  protected get filteredUsers(): Usuario[] {
    const term = this.search.trim().toLowerCase();

    if (!term) {
      return this.usuarios;
    }

    return this.usuarios.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term),
    );
  }

  /**
   * Iniciales para avatar
   */
  protected getInitials(fullName: string): string {
    return (
      fullName
        ?.split(' ')
        .map((word) => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? ''
    );
  }

  /**
   * Abrir modal crear usuario
   */
  protected openCreateUser(): void {
    this.createUserForm.reset({ role: 'SELLER' });
    this.createModal.present();
  }

  /**
   * Cerrar modal
   */
  protected closeModal(): void {
    this.createModal.dismiss();
  }

  /**
   * Guardar nuevo usuario
   */
  protected guardarUsuario(): void {
    if (!this.createUserForm.valid) {
      this.mostrarError('Formulario inválido', 'Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;

    const payload: CreateUsuarioRequest = this.createUserForm.value;

    this.usuariosApiService.crear(payload).subscribe({
      next: (nuevoUsuario) => {
        this.isLoading = false;
        this.usuarios.push(nuevoUsuario);
        this.createModal.dismiss();
        this.mostrarExito('Usuario creado exitosamente');
      },
      error: (error) => {
        this.isLoading = false;
        this.mostrarError('Error al crear usuario', error?.error?.message);
      },
    });
  }

  /**
   * Abrir menú de acciones del usuario
   */
  protected openUserMenu(user: Usuario): void {
    this.selectedUser = user;
    this.showActionSheet = true;
  }

  /**
   * Cerrar action sheet
   */
  protected closeActionSheet(): void {
    this.showActionSheet = false;
    this.selectedUser = null;
  }

  /**
   * Cambiar estado del usuario (activo/inactivo)
   */
  protected async toggleUserStatus(): Promise<void> {
    if (!this.selectedUser) return;

    this.showActionSheet = false;

    const nuevoEstado = !this.selectedUser.isActive;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertController.create({
      header: `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      message: `¿Estás seguro de que deseas ${accion} a ${this.selectedUser.fullName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: accion.charAt(0).toUpperCase() + accion.slice(1),
          role: 'confirm',
          handler: () => {
            this.isLoading = true;
            this.usuariosApiService
              .cambiarEstado(this.selectedUser!.id, { isActive: nuevoEstado })
              .subscribe({
                next: (usuarioActualizado) => {
                  this.isLoading = false;
                  const index = this.usuarios.findIndex((u) => u.id === usuarioActualizado.id);
                  if (index !== -1) {
                    this.usuarios[index] = usuarioActualizado;
                  }
                  this.mostrarExito(`Usuario ${accion}do exitosamente`);
                  this.selectedUser = null;
                },
                error: (error) => {
                  this.isLoading = false;
                  this.mostrarError(`Error al ${accion} usuario`, error?.error?.message);
                },
              });
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Editar usuario (para futura implementación)
   */
  protected async editarUsuario(): Promise<void> {
    if (!this.selectedUser) return;

    this.showActionSheet = false;

    const alert = await this.alertController.create({
      header: 'Editar usuario',
      message: 'La funcionalidad de edición estará disponible próximamente',
      buttons: [{ text: 'OK', role: 'cancel' }],
    });

    await alert.present();
  }

  /**
   * Eliminar usuario (cambiar estado a inactivo)
   */
  protected async eliminarUsuario(): Promise<void> {
    if (!this.selectedUser) return;

    this.showActionSheet = false;

    const alert = await this.alertController.create({
      header: 'Eliminar usuario',
      message: `¿Estás seguro de que deseas eliminar a ${this.selectedUser.fullName}? Esta acción puede ser reversible desactivando el usuario.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // En este caso, eliminamos desactivando el usuario
            this.isLoading = true;
            this.usuariosApiService.cambiarEstado(this.selectedUser!.id, { isActive: false }).subscribe({
              next: (usuarioEliminado) => {
                this.isLoading = false;
                const index = this.usuarios.findIndex((u) => u.id === usuarioEliminado.id);
                if (index !== -1) {
                  this.usuarios[index] = usuarioEliminado;
                }
                this.mostrarExito('Usuario eliminado exitosamente');
                this.selectedUser = null;
              },
              error: (error) => {
                this.isLoading = false;
                this.mostrarError('Error al eliminar usuario', error?.error?.message);
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Mostrar mensaje de error
   */
  private async mostrarError(titulo: string, mensaje?: string): Promise<void> {
    const toast = await this.toastController.create({
      header: titulo,
      message: mensaje || 'Ha ocurrido un error',
      duration: 3000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  /**
   * Mostrar mensaje de éxito
   */
  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'success',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  /**
   * Obtener botones dinámicos para el action sheet
   */
  protected getActionButtons(): any[] {
    if (!this.selectedUser) {
      return [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ];
    }

    return [
      {
        text: this.selectedUser.isActive ? 'Desactivar' : 'Activar',
        icon: this.selectedUser.isActive ? 'lock-closed-outline' : 'lock-open-outline',
        handler: () => {
          this.toggleUserStatus();
        },
      },
      {
        text: 'Editar',
        icon: 'pencil-outline',
        handler: () => {
          this.editarUsuario();
        },
      },
      {
        text: 'Eliminar',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          this.eliminarUsuario();
        },
      },
      {
        text: 'Cancelar',
        role: 'cancel',
      },
    ];
  }
}
