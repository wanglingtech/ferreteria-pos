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
} from '@ionic/angular/standalone';

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
  ],
})
export class DashboardPage implements OnInit {
  protected readonly user = this.authSession.getCurrentUser();

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authSession.isAuthenticated()) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    }
  }

  protected logout(): void {
    this.authSession.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  protected get initials(): string {
    return this.user?.fullName?.charAt(0)?.toUpperCase() || 'U';
  }
}
