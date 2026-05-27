import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventario-page',
  standalone: true,
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardContent, IonText],
})
export class InventarioPage {}
