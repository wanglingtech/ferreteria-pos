import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-productos-page',
  standalone: true,
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardContent, IonText],
})
export class ProductosPage {}
