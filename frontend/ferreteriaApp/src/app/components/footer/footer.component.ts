import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonFooter,
  IonIcon,
  IonLabel,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  basketOutline,
  cubeOutline,
  gridOutline,
  layersOutline,
  peopleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonFooter,
    IonToolbar,
    IonIcon,
    IonLabel,
  ],
})
export class FooterComponent {
  protected readonly items = [
    { label: 'Inicio', path: '/app/dashboard', icon: 'grid-outline' },
    { label: 'Productos', path: '/app/productos', icon: 'cube-outline' },
    { label: 'Ventas', path: '/app/ventas', icon: 'basket-outline' },
    { label: 'Inventario', path: '/app/inventario', icon: 'layers-outline' },
    { label: 'Usuarios', path: '/app/usuarios', icon: 'people-outline' },
    { label: 'Reportes', path: '/app/reportes', icon: 'bar-chart-outline' },
  ];

  constructor() {
    addIcons({
      gridOutline,
      cubeOutline,
      basketOutline,
      layersOutline,
      peopleOutline,
      barChartOutline,
    });
  }
}
