import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';

import { addIcons } from 'ionicons';

import {
  alertCircleOutline,
  analyticsOutline,
  barChartOutline,
  businessOutline,
  cartOutline,
  cashOutline,
  cubeOutline,
  layersOutline,
  peopleOutline,
  pieChartOutline,
  receiptOutline,
  settingsOutline,
  statsChartOutline,
} from 'ionicons/icons';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class DashboardPage {
  protected readonly user = this.authSession.getCurrentUser();

  protected activeView = 'overview';

  constructor(private readonly authSession: AuthSessionService) {
    addIcons({
      businessOutline,
      cashOutline,
      receiptOutline,
      cubeOutline,
      alertCircleOutline,
      statsChartOutline,
      pieChartOutline,
      analyticsOutline,
      layersOutline,
      cartOutline,
      peopleOutline,
      barChartOutline,
      settingsOutline,
    });
  }
}
