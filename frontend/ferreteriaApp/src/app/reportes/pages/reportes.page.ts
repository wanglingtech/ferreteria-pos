import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardContent, IonText],
})
export class ReportesPage {}
