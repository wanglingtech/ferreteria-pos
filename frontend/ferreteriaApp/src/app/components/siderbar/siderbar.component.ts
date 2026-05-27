import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuToggle,
  MenuController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  barChartOutline,
  basketOutline,
  cubeOutline,
  gridOutline,
  layersOutline,
  logOutOutline,
  peopleOutline,
} from 'ionicons/icons';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-siderbar',
  standalone: true,
  templateUrl: './siderbar.component.html',
  styleUrls: ['./siderbar.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
  ],
})
export class SiderbarComponent {
  protected readonly items = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'grid-outline' },
    { label: 'Productos', path: '/app/productos', icon: 'cube-outline' },
    { label: 'Ventas', path: '/app/ventas', icon: 'basket-outline' },
    { label: 'Inventario', path: '/app/inventario', icon: 'layers-outline' },
    { label: 'Usuarios', path: '/app/usuarios', icon: 'people-outline' },
    { label: 'Reportes', path: '/app/reportes', icon: 'bar-chart-outline' },
  ];

  constructor(
    private readonly router: Router,
    private readonly menuCtrl: MenuController,
    private readonly authSession: AuthSessionService,
  ) {
    addIcons({
      gridOutline,
      cubeOutline,
      basketOutline,
      layersOutline,
      peopleOutline,
      barChartOutline,
      logOutOutline,
    });
  }

  async onNavigate(): Promise<void> {
    await this.menuCtrl.close('main-menu');
  }

  logout(): void {
    this.authSession.clearSession();

    this.menuCtrl.close('main-menu');

    this.router.navigateByUrl('/auth/login', {
      replaceUrl: true,
    });
  }
}
