import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonAvatar,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  imageOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { UsuariosApiService } from '../../usuarios/services/usuarios-api.service';
import { UpdateUsuarioRequest } from '../../usuarios/interfaces/usuario.interface';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonAvatar,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
  ],
})
export class ProfileModalComponent implements OnInit {
  isOpen = false;
  isLoading = false;
  profileForm: FormGroup;
  currentUser: any = null;
  previewImage: string | null = null;

  // ✅ Tipado fuerte para los controles del formulario
  get f(): {
    fullName: AbstractControl;
    email: AbstractControl;
    imageUrl: AbstractControl;
  } {
    return {
      fullName: this.profileForm.get('fullName') as AbstractControl,
      email: this.profileForm.get('email') as AbstractControl,
      imageUrl: this.profileForm.get('imageUrl') as AbstractControl,
    };
  }

  private fb = inject(FormBuilder);
  private authSession = inject(AuthSessionService);
  private usuariosApi = inject(UsuariosApiService);
  private toastCtrl = inject(ToastController);

  // ✅ Validadores personalizados
  private fullNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    if (value.length < 2) return { minlength: true };
    if (value.length > 100) return { maxlength: true };
    // Solo letras, espacios, guiones, apóstrofes, puntos (sin números ni símbolos)
    const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:[\s\-'\.][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/;
    if (!regex.test(value)) return { pattern: true };
    return null;
  }

  private imageUrlValidator(control: AbstractControl): ValidationErrors | null {
    const url = control.value?.trim();
    if (!url) return null;
    // Debe ser https
    if (!url.startsWith('https://')) {
      return { invalidUrl: true };
    }
    // Extensiones de imagen permitidas
    const validExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
    ];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().endsWith(ext),
    );
    if (!hasValidExtension) {
      return { pattern: true };
    }
    // Validación básica de URL
    const urlRegex = /^https:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/;
    if (!urlRegex.test(url)) {
      return { invalidUrl: true };
    }
    return null;
  }

  constructor() {
    addIcons({ closeOutline, saveOutline, imageOutline, alertCircleOutline });
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, this.fullNameValidator]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      imageUrl: ['', [this.imageUrlValidator]],
    });
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.currentUser = this.authSession.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        fullName: this.currentUser.fullName,
        email: this.currentUser.email,
        imageUrl: this.currentUser.imageUrl || '',
      });
      this.previewImage = this.currentUser.imageUrl || null;
    }
  }

  open() {
    this.isOpen = true;
    this.loadUser();
  }

  close() {
    this.isOpen = false;
    this.isLoading = false;
  }

  onImageUrlChange() {
    const url = this.profileForm.get('imageUrl')?.value;
    this.previewImage = url || null;
  }

  async save() {
    if (this.profileForm.invalid || this.isLoading || !this.currentUser) {
      Object.keys(this.profileForm.controls).forEach((key) => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const payload: UpdateUsuarioRequest = {
      fullName: this.profileForm.value.fullName.trim(),
      email: this.profileForm.value.email.trim(),
      imageUrl: this.profileForm.value.imageUrl?.trim() || undefined,
    };

    try {
      const updated = await firstValueFrom(
        this.usuariosApi.actualizarMiPerfil(payload),
      );
      const updatedUser = { ...this.currentUser, ...updated };
      this.authSession.updateCurrentUser(updatedUser);
      this.currentUser = updatedUser;
      this.previewImage = updatedUser.imageUrl || null;
      this.mostrarMensaje('Perfil actualizado correctamente', 'success');
      this.close();
    } catch (error: any) {
      console.error(error);
      this.mostrarMensaje(
        error?.error?.message || 'Error al actualizar el perfil',
        'danger',
      );
    } finally {
      this.isLoading = false;
    }
  }

  private async mostrarMensaje(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    toast.present();
  }
}
