import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, NavigationEnd, Router } from '@angular/router';
import { IonMenu, IonRouterOutlet, MenuController } from '@ionic/angular/standalone';
import { Subject, filter, startWith, takeUntil } from 'rxjs';

import { HeaderComponent, HeaderUserInfo } from '../components/header/header.component';
import { SiderbarComponent } from '../components/siderbar/siderbar.component';
import { FooterComponent } from '../components/footer/footer.component';
import { AuthSessionService } from '../core/services/auth-session.service';

@Component({
  selector: 'app-shell-page',
  standalone: true,
  templateUrl: './app-shell.page.html',
  styleUrls: ['./app-shell.page.scss'],
  imports: [
    CommonModule,
    IonMenu,
    IonRouterOutlet,
    HeaderComponent,
    SiderbarComponent,
    FooterComponent,
  ],
})
export class AppShellPage implements OnInit, OnDestroy {
  protected pageTitle = 'Dashboard';
  protected pageSubtitle = 'Ferretería July';
  protected user: HeaderUserInfo | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authSession: AuthSessionService,
    private readonly menuController: MenuController,
  ) {}

  ngOnInit(): void {
    const sessionUser = this.authSession.getCurrentUser();
    this.user = sessionUser
      ? { fullName: sessionUser.fullName, role: sessionUser.role }
      : null;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.syncRouteInfo());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async toggleSidebar(): Promise<void> {
    await this.menuController.toggle('app-sidebar');
  }

  protected async closeSidebar(): Promise<void> {
    await this.menuController.close('app-sidebar');
  }

  protected onNotificationClick(): void {
    // Placeholder para futura bandeja de notificaciones
  }

  private syncRouteInfo(): void {
    const route = this.getDeepestRoute(this.activatedRoute);
    const data = route.snapshot.data as Data;

    this.pageTitle = (data['title'] as string) || 'Dashboard';
    this.pageSubtitle = (data['subtitle'] as string) || 'Ferretería July';
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
