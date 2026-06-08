import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterOutlet,
} from '@angular/router';
import { filter, debounceTime, map } from 'rxjs';

import {
  IonMenu,
  MenuController,
  IonContent,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

import { HeaderComponent } from '../components/header/header.component';
import { SiderbarComponent } from '../components/siderbar/siderbar.component';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { AuthSessionService } from '../core/services/auth-session.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  imports: [
    CommonModule,
    IonMenu,
    IonContent,
    IonRouterOutlet, // ✅ IMPORTANTE (arregla NG8001)
    HeaderComponent,
    SiderbarComponent,
    BottomNavComponent,
  ],
})
export class AppShellComponent implements OnInit {
  protected pageTitle = 'Dashboard';
  protected pageSubtitle = 'Ferretería July';
  protected user = this.authSession.getCurrentUser();

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authSession: AuthSessionService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // ✅ Cargar título inicial
    this.updateTitleFromRoute();

    // ✅ Escuchar cambios de ruta para actualizar título DINÁMICAMENTE
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        debounceTime(100) // Esperar a que la ruta se procese completamente
      )
      .subscribe(() => {
        this.updateTitleFromRoute();
      });

    // ✅ Cargar notificaciones al inicializar
    this.notificationService.cargarNotificaciones();

    // ✅ Actualizar user cuando cambia en session
    this.authSession.currentUser$.subscribe((updatedUser) => {
      this.user = updatedUser;
    });
  }

  private updateTitleFromRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const data = route.snapshot.data;
    this.pageTitle = data?.['title'] ?? 'Dashboard';
    this.pageSubtitle = data?.['subtitle'] ?? 'Ferretería July';
  }

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async closeMenu(): Promise<void> {
    await this.menuCtrl.close('main-menu');
  }
}
