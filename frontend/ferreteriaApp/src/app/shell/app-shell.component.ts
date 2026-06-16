import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterOutlet,
} from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
    IonRouterOutlet,
    HeaderComponent,
    SiderbarComponent,
    BottomNavComponent,
  ],
})
export class AppShellComponent implements OnInit, OnDestroy, AfterViewInit {
  protected pageTitle = 'Dashboard';
  protected pageSubtitle = 'Ferretería July';
  protected user = this.authSession.getCurrentUser();

  private destroy$ = new Subject<void>();

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authSession: AuthSessionService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // 1. Actualizar título al navegar
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateTitleFromRoute();
      });

    // 2. Actualizar usuario cuando cambie en sesión
    this.authSession.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedUser) => {
        this.user = updatedUser;
      });

    // 3. Cargar notificaciones
    this.notificationService.cargarNotificaciones();

    // 4. Inicializar título
    this.updateTitleFromRoute();
  }

  ngAfterViewInit(): void {
    // Reforzar actualización después de renderizar (útil para carga inicial)
    setTimeout(() => this.updateTitleFromRoute(), 50);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtiene el título y subtítulo de la ruta activa usando RouterState.
   * Recorre el árbol de rutas desde la raíz para encontrar la hoja activa.
   */
  private updateTitleFromRoute(): void {
    // Obtener la ruta raíz del estado actual
    let route = this.router.routerState.snapshot.root;
    // Avanzar por los hijos hasta la hoja (último hijo sin firstChild)
    while (route.firstChild) {
      route = route.firstChild;
    }
    // Obtener los datos de la ruta activa (la hoja)
    const data = route.data || {};

    const title = data['title'] ?? 'Dashboard';
    const subtitle = data['subtitle'] ?? 'Ferretería July';

    if (this.pageTitle !== title) {
      this.pageTitle = title;
    }
    if (this.pageSubtitle !== subtitle) {
      this.pageSubtitle = subtitle;
    }

    // Depuración (descomentar para ver en consola)
    // console.log(`📌 Título: ${this.pageTitle} - Subtítulo: ${this.pageSubtitle}`);
  }

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async closeMenu(): Promise<void> {
    await this.menuCtrl.close('main-menu');
  }
}
