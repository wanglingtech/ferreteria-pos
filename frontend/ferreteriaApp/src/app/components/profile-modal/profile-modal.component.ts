import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
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
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, imageOutline } from 'ionicons/icons';
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
  ],
})
export class ProfileModalComponent implements OnInit {
  isOpen = false;
  profileForm: FormGroup;
  currentUser: any = null;
  previewImage: string | null = null;

  private fb = inject(FormBuilder);
  private authSession = inject(AuthSessionService);
  private usuariosApi = inject(UsuariosApiService);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ closeOutline, saveOutline, imageOutline });
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      imageUrl: [''],
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
  }

  onImageUrlChange() {
    const url = this.profileForm.get('imageUrl')?.value;
    this.previewImage = url;
  }

  async save() {
    if (this.profileForm.invalid || !this.currentUser) return;
    const payload: UpdateUsuarioRequest = {
      fullName: this.profileForm.value.fullName,
      email: this.profileForm.value.email,
      imageUrl: this.profileForm.value.imageUrl || undefined,
    };
    try {
      const updated = await firstValueFrom(
        this.usuariosApi.actualizar(this.currentUser.id, payload),
      );
      const updatedUser = { ...this.currentUser, ...updated };
      localStorage.setItem('fj_user', JSON.stringify(updatedUser));
      this.authSession['currentUserSubject'].next(updatedUser);
      this.currentUser = updatedUser;
      this.mostrarMensaje('Perfil actualizado', 'success');
      this.close();
    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error al actualizar', 'danger');
    }
  }

  private async mostrarMensaje(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
