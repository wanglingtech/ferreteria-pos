import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonAvatar,
  IonButton,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, notificationsOutline } from 'ionicons/icons';

export interface HeaderUserInfo {
  fullName: string;
  role: string;
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
  ],
})
export class HeaderComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = 'Ferretería July';
  @Input() user: HeaderUserInfo | null = null;

  @Output() menuClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();

  constructor() {
    addIcons({ menuOutline, notificationsOutline });
  }

  protected get userInitials(): string {
    const fullName = this.user?.fullName?.trim();
    if (!fullName) {
      return 'US';
    }

    const words = fullName.split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  protected onMenuClick(): void {
    this.menuClick.emit();
  }

  protected onNotificationClick(): void {
    this.notificationClick.emit();
  }
}
