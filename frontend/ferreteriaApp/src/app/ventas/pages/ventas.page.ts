import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-ventas-page',
  standalone: true,
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardContent, IonText],
})
export class VentasPage {}
