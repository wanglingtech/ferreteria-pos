import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  IonCard,
  IonCardContent,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventario-page',
  standalone: true,
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,

    // 🔴 ESTO FALTABA
    IonHeader,
    IonToolbar,
    IonTitle,
  ],
})
export class InventarioPage implements OnInit {
  resumen: any = null;
  lowStockProducts: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadResumen();
  }

  loadResumen() {
    this.http.get('http://localhost:3000/inventario/resumen').subscribe({
      next: (data) => (this.resumen = data),
      error: (err) => console.error(err),
    });
  }
}
