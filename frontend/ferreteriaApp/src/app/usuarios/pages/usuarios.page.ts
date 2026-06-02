import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

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
  pencilOutline,
  trashOutline,
  lockOpenOutline,
  lockClosedOutline,
} from 'ionicons/icons';

import { UsuariosApiService } from '../services/usuarios-api.service';
import {
  Usuario,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../interfaces/usuario.interface';

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
  @ViewChild('editModal') editModal!: IonModal; // ✅ nuevo modal de edición
  @ViewChild('actionSheet') actionSheet!: IonActionSheet;

  protected search = '';
  protected usuarios: Usuario[] = [];
  protected createUserForm: FormGroup;
  protected editUserForm: FormGroup; // ✅ formulario para editar
  protected isLoading = false;
  protected selectedUser: Usuario | null = null;
  protected showActionSheet = false;
  protected editingUserId: number | null = null; // ✅ id del usuario en edición

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

    // ✅ formulario para editar (sin password obligatorio)
    this.editUserForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      role: ['SELLER', Validators.required],
      password: ['', [Validators.minLength(6)]], // opcional
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

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

  protected get filteredUsers(): Usuario[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.usuarios;
    return this.usuarios.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term),
    );
  }

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

  // =================== CREAR USUARIO ===================
  protected openCreateUser(): void {
    this.createUserForm.reset({ role: 'SELLER' });
    this.createModal.present();
  }

  protected closeModal(): void {
    this.createModal.dismiss();
  }

  protected guardarUsuario(): void {
    if (!this.createUserForm.valid) {
      this.mostrarError(
        'Formulario inválido',
        'Por favor completa todos los campos correctamente',
      );
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

  // =================== MENÚ DE OPCIONES ===================
  protected openUserMenu(user: Usuario): void {
    this.selectedUser = user;
    this.showActionSheet = true;
  }

  protected closeActionSheet(): void {
    this.showActionSheet = false;
    this.selectedUser = null;
  }

  // =================== CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) ===================
  protected async toggleUserStatus(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;

    const nuevoEstado = !this.selectedUser.isActive;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertController.create({
      header: `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      message: `¿Estás seguro de que deseas ${accion} a ${this.selectedUser.fullName}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
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
                  const index = this.usuarios.findIndex(
                    (u) => u.id === usuarioActualizado.id,
                  );
                  if (index !== -1) this.usuarios[index] = usuarioActualizado;
                  this.mostrarExito(`Usuario ${accion}do exitosamente`);
                  this.selectedUser = null;
                },
                error: (error) => {
                  this.isLoading = false;
                  this.mostrarError(
                    `Error al ${accion} usuario`,
                    error?.error?.message,
                  );
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  // =================== EDITAR USUARIO ===================
  protected async editarUsuario(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;

    // Precargar datos en el formulario de edición
    this.editUserForm.patchValue({
      username: this.selectedUser.username,
      email: this.selectedUser.email,
      fullName: this.selectedUser.fullName,
      role: this.selectedUser.role,
      password: '', // limpiamos el campo password
    });
    this.editingUserId = this.selectedUser.id;
    this.editModal.present();
  }

  protected closeEditModal(): void {
    this.editModal.dismiss();
    this.editUserForm.reset();
    this.editingUserId = null;
  }

  protected actualizarUsuario(): void {
    if (!this.editUserForm.valid || this.editingUserId === null) {
      this.mostrarError('Formulario inválido', 'Por favor corrige los errores');
      return;
    }

    this.isLoading = true;
    const payload: UpdateUsuarioRequest = this.editUserForm.value;
    // Si el password está vacío, lo eliminamos del objeto para no enviarlo
    if (!payload.password) delete payload.password;

    this.usuariosApiService.actualizar(this.editingUserId, payload).subscribe({
      next: (usuarioActualizado) => {
        this.isLoading = false;
        const index = this.usuarios.findIndex(
          (u) => u.id === usuarioActualizado.id,
        );
        if (index !== -1) this.usuarios[index] = usuarioActualizado;
        this.editModal.dismiss();
        this.mostrarExito('Usuario actualizado correctamente');
        this.editingUserId = null;
      },
      error: (error) => {
        this.isLoading = false;
        this.mostrarError('Error al actualizar usuario', error?.error?.message);
      },
    });
  }

  // =================== ELIMINAR (DESACTIVAR) ===================
  protected async eliminarUsuario(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;

    const alert = await this.alertController.create({
      header: 'Eliminar usuario',
      message: `¿Estás seguro de que deseas eliminar a ${this.selectedUser.fullName}? Se desactivará su cuenta.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.isLoading = true;
            this.usuariosApiService
              .cambiarEstado(this.selectedUser!.id, { isActive: false })
              .subscribe({
                next: (usuarioEliminado) => {
                  this.isLoading = false;
                  const index = this.usuarios.findIndex(
                    (u) => u.id === usuarioEliminado.id,
                  );
                  if (index !== -1) this.usuarios[index] = usuarioEliminado;
                  this.mostrarExito(
                    'Usuario eliminado (desactivado) exitosamente',
                  );
                  this.selectedUser = null;
                },
                error: (error) => {
                  this.isLoading = false;
                  this.mostrarError(
                    'Error al eliminar usuario',
                    error?.error?.message,
                  );
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  // =================== BOTONES DEL ACTION SHEET ===================
  protected getActionButtons(): any[] {
    if (!this.selectedUser) return [{ text: 'Cancelar', role: 'cancel' }];
    return [
      {
        text: this.selectedUser.isActive ? 'Desactivar' : 'Activar',
        icon: this.selectedUser.isActive
          ? 'lock-closed-outline'
          : 'lock-open-outline',
        handler: () => this.toggleUserStatus(),
      },
      {
        text: 'Editar',
        icon: 'pencil-outline',
        handler: () => this.editarUsuario(),
      },
      {
        text: 'Eliminar',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.eliminarUsuario(),
      },
      { text: 'Cancelar', role: 'cancel' },
    ];
  }

  // =================== NOTIFICACIONES ===================
  private async mostrarError(titulo: string, mensaje?: string): Promise<void> {
    const toast = await this.toastController.create({
      header: titulo,
      message: mensaje || 'Ha ocurrido un error',
      duration: 3000,
      position: 'top',
      color: 'danger',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'success',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    await toast.present();
  }
}
