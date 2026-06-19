import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  ViewChild,
} from '@angular/core';
import {
  IonAvatar,
  IonButton,
  IonHeader,
  IonIcon,
  IonToolbar,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonContent,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  notificationsOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NotificationsModalComponent } from '../notifications-modal/notifications-modal.component';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

export interface HeaderUserInfo {
  fullName: string;
  role: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonAvatar,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonContent,
    NotificationsModalComponent,
    ProfileModalComponent,
    SettingsModalComponent,
  ],
})
export class HeaderComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = 'Ferretería July';
  @Input() user: HeaderUserInfo | null = null;

  @Output() menuClick = new EventEmitter<void>();

  @ViewChild(NotificationsModalComponent)
  notificationsModal!: NotificationsModalComponent;
  @ViewChild(ProfileModalComponent) profileModal!: ProfileModalComponent;
  @ViewChild(SettingsModalComponent) settingsModal!: SettingsModalComponent;
  @ViewChild(IonPopover) userMenuPopover!: IonPopover;

  private authSession = inject(AuthSessionService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({
      menuOutline,
      notificationsOutline,
      personOutline,
      settingsOutline,
      logOutOutline,
    });
  }

  /**
   * Obtiene las iniciales del usuario a partir del nombre completo.
   * @returns Iniciales (máximo 2 letras) o 'US' si no hay nombre.
   */
  get userInitials(): string {
    const fullName = this.user?.fullName?.trim();
    if (!fullName) return 'US';
    const words = fullName.split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  /**
   * Traduce el rol del usuario a un formato legible en español.
   */
  get userRoleLabel(): string {
    if (!this.user) return '';
    return this.user.role === 'ADMIN' ? 'Administrador' : 'Vendedor';
  }

  onMenuClick(): void {
    this.menuClick.emit();
  }

  onNotificationClick(): void {
    this.notificationsModal.open();
  }

  async openUserMenu(event: any): Promise<void> {
    await this.userMenuPopover.present(event);
  }

  async closeUserMenu(): Promise<void> {
    await this.userMenuPopover.dismiss();
  }

  openProfile(): void {
    this.closeUserMenu();
    this.profileModal.open();
  }

  openSettings(): void {
    this.closeUserMenu();
    this.settingsModal.open();
  }

  async logout(): Promise<void> {
    this.closeUserMenu();
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          handler: () => {
            this.authSession.clearSession();
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }
}
