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
import { firstValueFrom } from 'rxjs'; // ✅ importación necesaria

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

  /**
   * Devuelve el icono según el tipo de notificación
   */
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
    // Suscripción al observable de notificaciones para actualizar la lista
    this.notificationService.notifications$.subscribe((data) => {
      this.notifications = data;
      // Si se había seleccionado "Seleccionar todas", mantener la selección
      if (this.selectAllMode) {
        this.selectedIds.clear();
        this.notifications.forEach((n) => this.selectedIds.add(n.id));
      }
    });
  }

  /**
   * Abre el modal y carga las notificaciones
   */
  open() {
    this.isOpen = true;
    this.notificationService.cargarNotificaciones();
  }

  /**
   * Cierra el modal y limpia las selecciones
   */
  close() {
    this.isOpen = false;
    this.selectedIds.clear();
    this.selectAllMode = false;
  }

  /**
   * Marca una notificación como leída
   */
  async marcarComoLeida(notif: Notification) {
    try {
      await firstValueFrom(this.notificationService.marcarComoLeida(notif.id));
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje('Notificación marcada como leída', 'success');
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      this.mostrarMensaje('Error al marcar como leída', 'danger');
    }
  }

  /**
   * Elimina una notificación individual
   */
  async eliminarUna(notif: Notification) {
    try {
      await firstValueFrom(
        this.notificationService.eliminarNotificacion(notif.id),
      );
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje('Notificación eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar:', error);
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  /**
   * Selecciona o deselecciona una notificación para eliminar múltiple
   */
  toggleSeleccion(notif: Notification) {
    if (this.selectedIds.has(notif.id)) {
      this.selectedIds.delete(notif.id);
    } else {
      this.selectedIds.add(notif.id);
    }
    this.selectAllMode = this.selectedIds.size === this.notifications.length;
  }

  /**
   * Selecciona o deselecciona todas las notificaciones
   */
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

  /**
   * Elimina las notificaciones seleccionadas
   */
  async eliminarSeleccionadas() {
    if (this.selectedIds.size === 0) return;
    try {
      await firstValueFrom(
        this.notificationService.eliminarNotificaciones(
          Array.from(this.selectedIds),
        ),
      );
      this.notificationService.cargarNotificaciones();
      this.selectedIds.clear();
      this.selectAllMode = false;
      this.mostrarMensaje('Notificaciones eliminadas', 'success');
    } catch (error) {
      console.error('Error al eliminar seleccionadas:', error);
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  /**
   * Elimina todas las notificaciones
   */
  async eliminarTodas() {
    try {
      await firstValueFrom(this.notificationService.eliminarTodas());
      this.notificationService.cargarNotificaciones();
      this.selectedIds.clear();
      this.selectAllMode = false;
      this.mostrarMensaje('Todas las notificaciones eliminadas', 'success');
    } catch (error) {
      console.error('Error al eliminar todas:', error);
      this.mostrarMensaje('Error al eliminar todas', 'danger');
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async marcarTodasLeidas() {
    try {
      await firstValueFrom(this.notificationService.marcarTodasComoLeidas());
      // Recargar la lista para reflejar el cambio
      this.notificationService.cargarNotificaciones();
      this.mostrarMensaje(
        'Todas las notificaciones marcadas como leídas',
        'success',
      );
    } catch (error) {
      console.error('Error al marcar todas:', error);
      this.mostrarMensaje('Error al marcar todas', 'danger');
    }
  }

  /**
   * Muestra un toast con mensaje
   */
  private async mostrarMensaje(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
