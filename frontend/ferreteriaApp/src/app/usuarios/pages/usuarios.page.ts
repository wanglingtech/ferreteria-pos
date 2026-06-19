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
  // REFERENCIAS A MODALES Y ACTION SHEET
  // ============================================================
  @ViewChild('createModal') createModal!: IonModal;
  @ViewChild('editModal') editModal!: IonModal;
  @ViewChild('actionSheet') actionSheet!: IonActionSheet;

  // ============================================================
  // ESTADO Y DATOS
  // ============================================================
  protected search = '';
  protected usuarios: Usuario[] = [];
  protected createUserForm: FormGroup;
  protected editUserForm: FormGroup;
  protected isLoading = false;
  protected selectedUser: Usuario | null = null;
  protected showActionSheet = false;
  protected editingUserId: number | null = null;

  // ============================================================
  // VALIDADORES PERSONALIZADOS (ULTRA ESTRICTOS)
  // ============================================================

  /**
   * ✅ Valida username: SOLO letras minúsculas y números.
   * No permite mayúsculas, guiones, puntos, guiones bajos ni espacios.
   * Ejemplo válido: "juan123", "admin01"
   * Ejemplo inválido: "Juan_Perez", "juan-perez", "juan.perez"
   */
  private usernameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value.trim();
    if (value.length < 3) return { usernameInvalid: 'Mínimo 3 caracteres.' };
    if (value.length > 30) return { usernameInvalid: 'Máximo 30 caracteres.' };
    const regex = /^[a-z0-9]+$/;
    if (!regex.test(value)) {
      return {
        usernameInvalid:
          'Solo letras minúsculas (a-z) y números (0-9). Sin espacios, mayúsculas ni caracteres especiales.',
      };
    }
    return null;
  }

  /**
   * ✅ Valida nombre completo: mínimo dos palabras, cada una con mayúscula inicial.
   * Permite espacios, apóstrofes, guiones y puntos.
   * Ejemplo válido: "Juan Pérez", "María José", "D'Angelo", "Mª José"
   * Ejemplo inválido: "juan", "Juan", "Juan Perez" (sin mayúscula en Perez)
   */
  private fullNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value.trim();
    if (value.length < 2) return { fullNameInvalid: 'Mínimo 2 caracteres.' };
    if (value.length > 100)
      return { fullNameInvalid: 'Máximo 100 caracteres.' };
    // Debe tener al menos dos palabras, cada una con mayúscula inicial
    const words: string[] = value
      .split(/\s+/)
      .filter((word: string) => word.length > 0); // ✅ tipado explícito
    if (words.length < 2) {
      return {
        fullNameInvalid: 'Debe contener al menos dos nombres (ej: Juan Pérez).',
      };
    }
    // Cada palabra debe empezar con mayúscula y el resto minúsculas (o apóstrofe/punto)
    const regex = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*([-'\.][A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)?$/;
    for (const word of words) {
      if (!regex.test(word)) {
        return {
          fullNameInvalid:
            'Cada palabra debe empezar con mayúscula y continuar con minúsculas (ej: Juan Pérez). Use apóstrofes (D´Angelo) o puntos (Mª José).',
        };
      }
    }
    return null;
  }

  /**
   * ✅ VALIDADOR DE CONTRASEÑA ROBUSTO
   * Exige: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número.
   * No permite espacios.
   */
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (value.includes(' ')) {
      return { passwordInvalid: 'La contraseña no puede contener espacios.' };
    }
    if (value.length < 8) {
      return {
        passwordInvalid: 'La contraseña debe tener al menos 8 caracteres.',
      };
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    if (!hasUpper || !hasLower || !hasNumber) {
      return {
        passwordInvalid:
          'La contraseña debe tener al menos una mayúscula, una minúscula y un número.',
      };
    }
    return null;
  }

  // ============================================================
  // MÉTODOS PARA OBTENER MENSAJES DE ERROR LEGIBLES
  // ============================================================

  getUsernameErrorMessage(form: FormGroup): string {
    const control = form.get('username');
    if (control?.hasError('required'))
      return 'El nombre de usuario es requerido.';
    if (control?.hasError('usernameInvalid'))
      return control.getError('usernameInvalid');
    return '';
  }

  getFullNameErrorMessage(form: FormGroup): string {
    const control = form.get('fullName');
    if (control?.hasError('required'))
      return 'El nombre completo es requerido.';
    if (control?.hasError('fullNameInvalid'))
      return control.getError('fullNameInvalid');
    return '';
  }

  getEmailErrorMessage(form: FormGroup): string {
    const control = form.get('email');
    if (control?.hasError('required')) return 'El correo es requerido.';
    if (control?.hasError('email'))
      return 'Correo electrónico inválido (ej: usuario@dominio.com).';
    if (control?.hasError('maxlength')) return 'Máximo 100 caracteres.';
    return '';
  }

  getPasswordErrorMessage(form: FormGroup, isEdit: boolean = false): string {
    const control = form.get('password');
    if (!control) return '';
    if (!isEdit && control.hasError('required'))
      return 'La contraseña es requerida.';
    if (control.hasError('passwordInvalid'))
      return control.getError('passwordInvalid');
    return '';
  }

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
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

    // ============================
    // FORMULARIO CREAR
    // ============================
    this.createUserForm = this.formBuilder.group({
      username: ['', [Validators.required, this.usernameValidator]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      fullName: ['', [Validators.required, this.fullNameValidator]],
      password: ['', [Validators.required, this.passwordValidator]],
      role: ['SELLER', Validators.required],
    });

    // ============================
    // FORMULARIO EDITAR
    // ============================
    this.editUserForm = this.formBuilder.group({
      username: ['', [Validators.required, this.usernameValidator]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      fullName: ['', [Validators.required, this.fullNameValidator]],
      role: ['SELLER', Validators.required],
      password: ['', [this.passwordValidator]], // opcional
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // ============================================================
  // CRUD (sin cambios, se mantiene igual)
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
        this.usuarios.unshift(nuevo);
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
  // MENÚ DE OPCIONES
  // ============================================================
  protected openUserMenu(user: Usuario): void {
    this.selectedUser = user;
    this.showActionSheet = true;
  }

  protected closeActionSheet(): void {
    this.showActionSheet = false;
  }

  // ============================================================
  // CAMBIAR ESTADO
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
  // EDITAR USUARIO
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
  // ELIMINAR PERMANENTEMENTE
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
  // BOTONES DEL ACTION SHEET
  // ============================================================
  protected getActionButtons(): any[] {
    if (!this.selectedUser) return [{ text: 'Cancelar', role: 'cancel' }];
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
  // TOASTS
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
