import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  analyticsOutline,
  barChartOutline,
  cartOutline,
  cashOutline,
  cubeOutline,
  layersOutline,
  peopleOutline,
  pieChartOutline,
  pricetagsOutline,
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
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class DashboardPage {
  protected readonly user = this.authSession.getCurrentUser();

  constructor(private readonly authSession: AuthSessionService) {
    addIcons({
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
      pricetagsOutline,
      settingsOutline,
    });
  }
}
