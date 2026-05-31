import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  analyticsOutline,
  calendarOutline,
  barChartOutline,
  statsChartOutline,
  downloadOutline,
  trendingUpOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon],
})
export class ReportesPage {
  protected from = '';
  protected to = '';

  protected activeTab = 'resumen';

  protected reporte: any = null;

  constructor() {
    addIcons({
      analyticsOutline,
      calendarOutline,
      barChartOutline,
      statsChartOutline,
      downloadOutline,
      trendingUpOutline,
    });
  }

  protected changeTab(tab: string): void {
    this.activeTab = tab;
  }

  protected loadReport(): void {
    // Conectar con:
    // GET /reportes/resumen?from=...&to=...
  }

  protected exportReport(): void {
    // PDF / Excel
  }
}
