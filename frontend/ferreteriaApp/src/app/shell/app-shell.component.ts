import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';

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
export class AppShellComponent {
  protected pageTitle = 'Dashboard';
  protected pageSubtitle = 'Ferretería July';
  protected readonly user = this.authSession.getCurrentUser();

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authSession: AuthSessionService,
  ) {
    this.listenRouteChanges();
  }

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async closeMenu(): Promise<void> {
    await this.menuCtrl.close('main-menu');
  }

  private listenRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute;

        while (route.firstChild) {
          route = route.firstChild;
        }

        const data = route.snapshot.data;

        this.pageTitle = data?.['title'] ?? 'Dashboard';
        this.pageSubtitle = data?.['subtitle'] ?? 'Ferretería July';
      });
  }
}
