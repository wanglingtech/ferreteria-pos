import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { IonFooter, IonIcon } from '@ionic/angular/standalone';

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
  selector: 'app-bottom-nav',
  standalone: true,
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive, IonFooter, IonIcon],
})
export class BottomNavComponent {
  protected readonly items = [
    {
      label: 'Inicio',
      path: '/app/dashboard',
      icon: 'grid-outline',
    },
    {
      label: 'Productos',
      path: '/app/productos',
      icon: 'cube-outline',
    },
    {
      label: 'Ventas',
      path: '/app/ventas',
      icon: 'basket-outline',
    },
    {
      label: 'Inventario',
      path: '/app/inventario',
      icon: 'layers-outline',
    },
    {
      label: 'Usuarios',
      path: '/app/usuarios',
      icon: 'people-outline',
    },
    {
      label: 'Reportes',
      path: '/app/reportes',
      icon: 'bar-chart-outline',
    },
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
