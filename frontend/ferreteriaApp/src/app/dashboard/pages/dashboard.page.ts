import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonText,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  menuOutline,
  notificationsOutline,
  cashOutline,
  receiptOutline,
  cubeOutline,
  alertCircleOutline,
  layersOutline,
  cartOutline,
  peopleOutline,
  barChartOutline,
  pricetagsOutline,
  settingsOutline,
  statsChartOutline,
  pieChartOutline,
  analyticsOutline,
  logOutOutline,
} from 'ionicons/icons';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,

    IonCard,
    IonCardContent,

    IonText,
    IonButton,
    IonIcon,
  ],
})
export class DashboardPage implements OnInit {
  protected readonly user = this.authSession.getCurrentUser();

  protected initials = '';

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly router: Router,
  ) {
    /* =====================================================
       REGISTER ICONS
    ===================================================== */
    addIcons({
      menuOutline,
      notificationsOutline,

      cashOutline,
      receiptOutline,
      cubeOutline,
      alertCircleOutline,

      layersOutline,
      cartOutline,
      peopleOutline,
      barChartOutline,
      pricetagsOutline,
      settingsOutline,

      statsChartOutline,
      pieChartOutline,
      analyticsOutline,

      logOutOutline,
    });
  }

  ngOnInit(): void {
    if (!this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/auth/login', {
        replaceUrl: true,
      });

      return;
    }

    this.generateInitials();
  }

  /* =====================================================
     USER INITIALS
  ===================================================== */
  private generateInitials(): void {
    if (!this.user?.fullName) {
      this.initials = 'US';
      return;
    }

    const names = this.user.fullName.split(' ');

    this.initials =
      names.length >= 2 ? `${names[0][0]}${names[1][0]}` : names[0][0];

    this.initials = this.initials.toUpperCase();
  }

  /* =====================================================
     LOGOUT
  ===================================================== */
  protected logout(): void {
    this.authSession.logout();

    void this.router.navigateByUrl('/auth/login', {
      replaceUrl: true,
    });
  }
}
