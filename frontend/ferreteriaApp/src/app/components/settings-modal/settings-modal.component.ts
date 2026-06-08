import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonToggle,
  IonItem,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { UserSettingsService } from '../../core/services/user-settings.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonButton,
    IonIcon,
    IonToggle,
    IonItem,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
  ],
})
export class SettingsModalComponent implements OnInit {
  isOpen = false;
  notificationsEnabled = true;

  private settingsService = inject(UserSettingsService);

  constructor() {
    addIcons({ closeOutline, saveOutline, notificationsOutline });
  }

  ngOnInit() {
    this.settingsService.settings$.subscribe((settings) => {
      this.notificationsEnabled = settings.notificationsEnabled;
    });
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  save() {
    this.settingsService.updateSettings({
      notificationsEnabled: this.notificationsEnabled,
    });
    this.close();
  }
}
