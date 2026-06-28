import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
  private authService = inject(AuthSessionService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  private allItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'grid-outline' },
    { label: 'Productos', path: '/app/productos', icon: 'cube-outline' },
    { label: 'Ventas', path: '/app/ventas', icon: 'basket-outline' },
    { label: 'Inventario', path: '/app/inventario', icon: 'layers-outline' },
    { label: 'Usuarios', path: '/app/usuarios', icon: 'people-outline' },
    { label: 'Reportes', path: '/app/reportes', icon: 'bar-chart-outline' },
  ];

  protected readonly items = computed(() => {
    const user = this.authService.getCurrentUser();
    const role = user?.role;
    if (role === 'ADMIN') {
      return this.allItems;
    } else {
      return this.allItems.filter(
        (item) => item.path === '/app/productos' || item.path === '/app/ventas',
      );
    }
  });

  constructor() {
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
    this.authService.clearSession();
    this.menuCtrl.close('main-menu');
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
