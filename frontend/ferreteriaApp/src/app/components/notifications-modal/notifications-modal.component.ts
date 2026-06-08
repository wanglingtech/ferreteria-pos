import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCheckbox,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  trashOutline,
  closeOutline,
  notificationsOutline,
  cubeOutline,
  personAddOutline,
  cartOutline,
  documentOutline,
} from 'ionicons/icons';
import {
  NotificationService,
  Notification,
} from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications-modal',
  standalone: true,
  templateUrl: './notifications-modal.component.html',
  styleUrls: ['./notifications-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCheckbox,
  ],
})
export class NotificationsModalComponent implements OnInit {
  isOpen = false;
  notifications: Notification[] = [];
  selectedIds: Set<number> = new Set();
  selectAllMode = false;

  private notificationService = inject(NotificationService);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      checkmarkOutline,
      trashOutline,
      closeOutline,
      notificationsOutline,
      cubeOutline,
      personAddOutline,
      cartOutline,
      documentOutline,
    });
  }

  // ✅ NUEVO: Obtener ícono según tipo de notificación
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'producto_creado':
        return 'cube-outline';
      case 'usuario_creado':
        return 'person-add-outline';
      case 'venta_registrada':
        return 'cart-outline';
      case 'reporte_exportado':
        return 'document-outline';
      default:
        return 'notifications-outline';
    }
  }

  ngOnInit() {
    this.notificationService.notifications$.subscribe((data) => {
      this.notifications = data;
      if (this.selectAllMode) {
        this.selectedIds.clear();
        this.notifications.forEach((n) => this.selectedIds.add(n.id));
      }
    });
  }

  open() {
    this.isOpen = true;
    this.notificationService.cargarNotificaciones();
  }

  close() {
    this.isOpen = false;
    this.selectedIds.clear();
    this.selectAllMode = false;
  }

  async marcarComoLeida(notif: Notification) {
    try {
      await this.notificationService.marcarComoLeida(notif.id).toPromise();
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje('Notificación marcada como leída', 'success');
    } catch {
      this.mostrarMensaje('Error al marcar como leída', 'danger');
    }
  }

  async eliminarUna(notif: Notification) {
    try {
      await this.notificationService.eliminarNotificacion(notif.id).toPromise();
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje('Notificación eliminada', 'success');
    } catch {
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  toggleSeleccion(notif: Notification) {
    if (this.selectedIds.has(notif.id)) {
      this.selectedIds.delete(notif.id);
    } else {
      this.selectedIds.add(notif.id);
    }
    this.selectAllMode = this.selectedIds.size === this.notifications.length;
  }

  toggleSelectAll() {
    if (this.selectAllMode) {
      this.selectedIds.clear();
      this.selectAllMode = false;
    } else {
      this.selectedIds.clear();
      this.notifications.forEach((n) => this.selectedIds.add(n.id));
      this.selectAllMode = true;
    }
  }

  async eliminarSeleccionadas() {
    if (this.selectedIds.size === 0) return;
    try {
      await this.notificationService
        .eliminarNotificaciones(Array.from(this.selectedIds))
        .toPromise();
      this.notificationService.cargarNotificaciones();
      this.selectedIds.clear();
      this.selectAllMode = false;
      this.mostrarMensaje('Notificaciones eliminadas', 'success');
    } catch {
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  async eliminarTodas() {
    try {
      await this.notificationService.eliminarTodas().toPromise();
      this.notificationService.cargarNotificaciones();
      this.selectedIds.clear();
      this.selectAllMode = false;
      this.mostrarMensaje('Todas las notificaciones eliminadas', 'success');
    } catch {
      this.mostrarMensaje('Error al eliminar todas', 'danger');
    }
  }

  async marcarTodasLeidas() {
    try {
      await this.notificationService.marcarTodasComoLeidas().toPromise();
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje(
        'Todas las notificaciones marcadas como leídas',
        'success',
      );
    } catch {
      this.mostrarMensaje('Error al marcar todas', 'danger');
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
