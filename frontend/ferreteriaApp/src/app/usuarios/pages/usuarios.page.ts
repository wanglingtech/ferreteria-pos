import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
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
  // ============================================================
  // Referencias a modales y action sheet del template
  // ============================================================
  @ViewChild('createModal') createModal!: IonModal;
  @ViewChild('editModal') editModal!: IonModal;
  @ViewChild('actionSheet') actionSheet!: IonActionSheet;

  // ============================================================
  // Datos y estado de la página
  // ============================================================
  protected search = ''; // Término de búsqueda
  protected usuarios: Usuario[] = []; // Lista completa de usuarios
  protected createUserForm: FormGroup; // Formulario de creación
  protected editUserForm: FormGroup; // Formulario de edición
  protected isLoading = false; // Indicador de carga
  protected selectedUser: Usuario | null = null; // Usuario seleccionado para acciones
  protected showActionSheet = false; // Muestra/oculta action sheet
  protected editingUserId: number | null = null; // ID del usuario en edición

  // ============================================================
  // VALIDADORES PERSONALIZADOS (expresiones regulares)
  // ============================================================
  /**
   * Valida username: solo letras, números, guión bajo (_), punto (.), guión (-)
   */
  private usernameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const regex = /^[a-zA-Z0-9_.-]+$/;
    return regex.test(control.value) ? null : { usernameInvalid: true };
  }

  /**
   * Valida nombre completo: al menos una letra, permite espacios, guiones, apóstrofes, puntos.
   * Rechaza "...." o caracteres repetidos sin letras.
   */
  private fullNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const regex =
      /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+(?:[\s\-'\.][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+)*$/;
    return regex.test(control.value) ? null : { fullNameInvalid: true };
  }

  // ============================================================
  // MÉTODOS PARA OBTENER MENSAJES DE ERROR LEGIBLES
  // ============================================================
  getUsernameErrorMessage(form: FormGroup): string {
    const control = form.get('username');
    if (control?.hasError('required'))
      return 'El nombre de usuario es requerido';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (control?.hasError('maxlength')) return 'Máximo 30 caracteres';
    if (control?.hasError('usernameInvalid'))
      return 'Solo letras, números, guion bajo (_), punto (.) o guión (-). Sin espacios.';
    return '';
  }

  getFullNameErrorMessage(form: FormGroup): string {
    const control = form.get('fullName');
    if (control?.hasError('required')) return 'El nombre completo es requerido';
    if (control?.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (control?.hasError('maxlength')) return 'Máximo 100 caracteres';
    if (control?.hasError('fullNameInvalid'))
      return 'Use letras, espacios, guiones, apóstrofes o puntos (ej: Juan Pérez, Mª José, D´Angelo).';
    return '';
  }

  getEmailErrorMessage(form: FormGroup): string {
    const control = form.get('email');
    if (control?.hasError('required')) return 'El correo es requerido';
    if (control?.hasError('email')) return 'Correo electrónico inválido';
    if (control?.hasError('maxlength')) return 'Máximo 100 caracteres';
    return '';
  }

  getPasswordErrorMessage(form: FormGroup, isEdit: boolean = false): string {
    const control = form.get('password');
    if (!control) return '';
    if (!isEdit && control.hasError('required'))
      return 'La contraseña es requerida';
    if (control.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }

  // ============================================================
  // CONSTRUCTOR: inicializa formularios e iconos
  // ============================================================
  constructor(
    private readonly usuariosApiService: UsuariosApiService,
    private readonly formBuilder: FormBuilder,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    // Registrar iconos utilizados en el template
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

    // Formulario de creación
    this.createUserForm = this.formBuilder.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          this.usernameValidator,
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          this.fullNameValidator,
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['SELLER', Validators.required],
    });

    // Formulario de edición (contraseña opcional)
    this.editUserForm = this.formBuilder.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          this.usernameValidator,
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          this.fullNameValidator,
        ],
      ],
      role: ['SELLER', Validators.required],
      password: ['', [Validators.minLength(6)]], // opcional
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // ============================================================
  // CRUD: Cargar usuarios desde el backend
  // ============================================================
  protected cargarUsuarios(): void {
    this.isLoading = true;
    this.usuariosApiService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarError('Error al cargar usuarios', err?.error?.message);
      },
    });
  }

  // ============================================================
  // Búsqueda local (filtra por nombre, email o username)
  // ============================================================
  protected get filteredUsers(): Usuario[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.usuarios;
    return this.usuarios.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term),
    );
  }

  // Obtener iniciales para el avatar
  protected getInitials(fullName: string): string {
    return (
      fullName
        ?.split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? ''
    );
  }

  // ============================================================
  // CREAR USUARIO
  // ============================================================
  protected openCreateUser(): void {
    this.createUserForm.reset({ role: 'SELLER' });
    this.createModal.present();
  }

  protected closeModal(): void {
    this.createModal.dismiss();
  }

  protected guardarUsuario(): void {
    if (!this.createUserForm.valid) {
      // Marcar todos los campos como "tocados" para mostrar errores
      Object.keys(this.createUserForm.controls).forEach((key) =>
        this.createUserForm.get(key)?.markAsTouched(),
      );
      this.mostrarError('Formulario inválido', 'Corrige los errores marcados');
      return;
    }
    this.isLoading = true;
    const payload: CreateUsuarioRequest = this.createUserForm.value;
    this.usuariosApiService.crear(payload).subscribe({
      next: (nuevo) => {
        this.isLoading = false;
        this.usuarios.unshift(nuevo); // Añadir al inicio de la lista
        this.createModal.dismiss();
        this.mostrarExito('Usuario creado exitosamente');
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarError('Error al crear usuario', err?.error?.message);
      },
    });
  }

  // ============================================================
  // MENÚ DE OPCIONES (action sheet)
  // ============================================================
  protected openUserMenu(user: Usuario): void {
    this.selectedUser = user;
    this.showActionSheet = true;
  }

  protected closeActionSheet(): void {
    this.showActionSheet = false;
  }

  // ============================================================
  // CAMBIAR ESTADO (activar / desactivar)
  // ============================================================
  protected async toggleUserStatus(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;
    const nuevoEstado = !this.selectedUser.isActive;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertController.create({
      header: `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      message: `¿Seguro que deseas ${accion} a ${this.selectedUser.fullName}?`,
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
                next: (actualizado) => {
                  this.isLoading = false;
                  const idx = this.usuarios.findIndex(
                    (u) => u.id === actualizado.id,
                  );
                  if (idx !== -1) this.usuarios[idx] = actualizado;
                  this.mostrarExito(`Usuario ${accion}do exitosamente`);
                  this.selectedUser = null;
                },
                error: (err) => {
                  this.isLoading = false;
                  this.mostrarError(
                    `Error al ${accion} usuario`,
                    err?.error?.message,
                  );
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  // ============================================================
  // EDITAR USUARIO (cargar datos en el formulario)
  // ============================================================
  protected async editarUsuario(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;
    this.editUserForm.patchValue({
      username: this.selectedUser.username,
      email: this.selectedUser.email,
      fullName: this.selectedUser.fullName,
      role: this.selectedUser.role,
      password: '',
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
      Object.keys(this.editUserForm.controls).forEach((key) => {
        if (this.editUserForm.get(key)?.invalid)
          this.editUserForm.get(key)?.markAsTouched();
      });
      this.mostrarError('Formulario inválido', 'Corrige los errores');
      return;
    }
    this.isLoading = true;
    const payload: UpdateUsuarioRequest = this.editUserForm.value;
    // Si la contraseña está vacía, no la enviamos (no se actualizará)
    if (!payload.password) delete payload.password;

    this.usuariosApiService.actualizar(this.editingUserId, payload).subscribe({
      next: (actualizado) => {
        this.isLoading = false;
        const idx = this.usuarios.findIndex((u) => u.id === actualizado.id);
        if (idx !== -1) this.usuarios[idx] = actualizado;
        this.editModal.dismiss();
        this.mostrarExito('Usuario actualizado correctamente');
        this.editingUserId = null;
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarError('Error al actualizar', err?.error?.message);
      },
    });
  }

  // ============================================================
  // ELIMINAR FÍSICAMENTE (PERMANENTE)
  // ============================================================
  protected async eliminarUsuarioFisicamente(): Promise<void> {
    if (!this.selectedUser) return;
    this.showActionSheet = false;

    const alert = await this.alertController.create({
      header: 'Eliminar usuario permanentemente',
      message: `¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE a ${this.selectedUser.fullName}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.isLoading = true;
            this.usuariosApiService.eliminar(this.selectedUser!.id).subscribe({
              next: () => {
                this.isLoading = false;
                this.usuarios = this.usuarios.filter(
                  (u) => u.id !== this.selectedUser!.id,
                );
                this.mostrarExito('Usuario eliminado permanentemente');
                this.selectedUser = null;
              },
              error: (err) => {
                this.isLoading = false;
                this.mostrarError('Error al eliminar', err?.error?.message);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  // ============================================================
  // CONSTRUCCIÓN DE BOTONES DEL ACTION SHEET
  // ============================================================
  protected getActionButtons(): any[] {
    if (!this.selectedUser) return [{ text: 'Cancelar', role: 'cancel' }];
    // Texto e icono dinámicos según el estado actual
    const statusText = this.selectedUser.isActive ? 'Desactivar' : 'Activar';
    const statusIcon = this.selectedUser.isActive
      ? 'lock-closed-outline'
      : 'lock-open-outline';

    return [
      {
        text: statusText,
        icon: statusIcon,
        handler: () => this.toggleUserStatus(),
      },
      {
        text: 'Editar',
        icon: 'pencil-outline',
        handler: () => this.editarUsuario(),
      },
      {
        text: 'Eliminar permanentemente',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.eliminarUsuarioFisicamente(),
      },
      { text: 'Cancelar', role: 'cancel' },
    ];
  }

  // ============================================================
  // NOTIFICACIONES (toasts)
  // ============================================================
  private async mostrarError(titulo: string, mensaje?: string): Promise<void> {
    const toast = await this.toastController.create({
      header: titulo,
      message: mensaje || 'Ha ocurrido un error',
      duration: 4000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }
}
