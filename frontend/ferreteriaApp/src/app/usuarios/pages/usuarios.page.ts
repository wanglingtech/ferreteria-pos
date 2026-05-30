import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  searchOutline,
  personAddOutline,
  peopleOutline,
  ellipsisVerticalOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon],
})
export class UsuariosPage {
  /**
   * Texto del buscador
   */
  protected search = '';

  /**
   * Usuarios obtenidos desde API
   *
   * Luego reemplazarás esto con:
   * usuariosService.listar()
   */
  protected usuarios: any[] = [];

  constructor() {
    addIcons({
      searchOutline,
      personAddOutline,
      peopleOutline,
      ellipsisVerticalOutline,
    });
  }

  /**
   * Filtrado local
   *
   * Cuando implementes backend
   * puedes cambiarlo por búsqueda
   * directa en servidor.
   */
  protected get filteredUsers(): any[] {
    const term = this.search.trim().toLowerCase();

    if (!term) {
      return this.usuarios;
    }

    return this.usuarios.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term),
    );
  }

  /**
   * Iniciales para avatar
   */
  protected getInitials(fullName: string): string {
    return (
      fullName
        ?.split(' ')
        .map((word) => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? ''
    );
  }

  /**
   * Abrir modal crear usuario
   *
   * Aquí luego conectarás:
   * IonModal
   */
  protected openCreateUser(): void {
    console.log('Abrir formulario crear usuario');
  }

  /**
   * Menú de acciones
   *
   * Aquí luego conectarás:
   * ActionSheet o Popover
   */
  protected openUserMenu(user: any): void {
    console.log('Acciones usuario:', user);
  }
}
