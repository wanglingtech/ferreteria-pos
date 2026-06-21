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
  IonGrid,
  IonRow,
  IonCol,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  imageOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  cloudUploadOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { UsuariosApiService } from '../../usuarios/services/usuarios-api.service';
import { UpdateUsuarioRequest } from '../../usuarios/interfaces/usuario.interface';

// ✅ Avatares predeterminados (imágenes de Unsplash - seguras y gratuitas)
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
];

// ✅ Lista negra de palabras para contenido inapropiado (se mantiene)
const BLACKLIST_WORDS = [
  'porn',
  'xxx',
  'sex',
  'nude',
  'desnudo',
  'gore',
  'blood',
  'violencia',
  'drogas',
  'narcotrafico',
  'terror',
  'asesinato',
  'muerte',
  'sangre',
  'puta',
  'zorra',
  'pene',
  'vagina',
  'coito',
  'orgia',
  'bestialidad',
  'pedofilia',
  'pederasta',
  'violacion',
  'esclavitud',
  'tortura',
  'swastika',
  'nazi',
  'kkk',
  'racismo',
  'homofobia',
];

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
    IonGrid,
    IonRow,
    IonCol,
  ],
})
export class ProfileModalComponent implements OnInit {
  isOpen = false;
  isLoading = false;
  profileForm: FormGroup;
  currentUser: any = null;
  previewImage: string | null = null;
  defaultAvatars = DEFAULT_AVATARS;

  // Referencia al input file oculto
  private fileInput?: HTMLInputElement;

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

  /**
   * ✅ Validador de nombre completo: mínimo dos palabras, sin caracteres repetidos sin sentido.
   */
  private fullNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    if (value.length < 2) return { minlength: true };
    if (value.length > 100) return { maxlength: true };

    const words = value.split(/\s+/).filter((word: string) => word.length > 0);
    if (words.length < 2) {
      return {
        pattern: 'Debe contener al menos dos palabras (nombre y apellido).',
      };
    }

    const wordRegex =
      /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:[\-'\.][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/;
    for (const word of words) {
      if (!wordRegex.test(word) || word.length < 2) {
        return {
          pattern: "Cada palabra debe ser válida (ej: Juan, María, D'Angelo).",
        };
      }
    }

    // No permitir caracteres repetidos sin sentido (ej: "zxczxczxc")
    const repeatedPattern = /^(.)\1{4,}/;
    if (repeatedPattern.test(value.replace(/\s/g, ''))) {
      return {
        pattern: 'Nombre inválido. No use caracteres repetidos sin sentido.',
      };
    }

    return null;
  }

  /**
   * ✅ Validador de URL de imagen (flexible pero con lista negra)
   * - Permite URLs de avatares predeterminados (https)
   * - Permite imágenes locales (data:image/...)
   * - Permite cualquier URL que comience con http/https y no contenga palabras prohibidas
   * - No exige extensión de imagen (para compatibilidad con servicios como Google Images)
   */
  private imageUrlValidator(control: AbstractControl): ValidationErrors | null {
    const url = control.value?.trim();
    if (!url) return null;

    const lowerUrl = url.toLowerCase();

    // 1. Permitir avatares locales (assets) y data URLs (imágenes subidas)
    if (lowerUrl.startsWith('assets/') || lowerUrl.startsWith('data:image/')) {
      return null;
    }

    // 2. Debe ser una URL válida (http o https)
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
      return { invalidUrl: 'La URL debe comenzar con http:// o https://' };
    }

    // 3. Lista negra de palabras prohibidas
    const hasBlacklistedWord = BLACKLIST_WORDS.some((word) =>
      lowerUrl.includes(word),
    );
    if (hasBlacklistedWord) {
      return {
        blacklisted:
          'La URL contiene contenido inapropiado. Elige otra imagen.',
      };
    }

    // 4. Validación básica de URL (seguridad)
    const urlRegex = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/;
    if (!urlRegex.test(url)) {
      return { invalidUrl: 'URL inválida. Formato incorrecto.' };
    }

    return null;
  }

  constructor() {
    addIcons({
      closeOutline,
      saveOutline,
      imageOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      cloudUploadOutline,
    });
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

  selectAvatar(url: string) {
    this.profileForm.patchValue({ imageUrl: url });
    this.previewImage = url;
    this.f.imageUrl.markAsTouched();
  }

  /**
   * Abre el selector de archivos para subir una imagen desde el dispositivo.
   */
  uploadImage() {
    // Crear input file si no existe
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
      this.fileInput.onchange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const dataUrl = e.target.result;
            this.profileForm.patchValue({ imageUrl: dataUrl });
            this.previewImage = dataUrl;
            this.f.imageUrl.markAsTouched();
            this.mostrarMensaje('Imagen cargada correctamente', 'success');
          };
          reader.readAsDataURL(file);
        }
      };
    }
    this.fileInput.click();
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
