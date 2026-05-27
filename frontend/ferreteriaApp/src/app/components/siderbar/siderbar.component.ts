import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuToggle,
  IonNote,
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
  selector: 'app-siderbar',
  standalone: true,
  templateUrl: './siderbar.component.html',
  styleUrls: ['./siderbar.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
  ],
})
export class SiderbarComponent {
  @Output() navigate = new EventEmitter<void>();

  protected readonly items = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'grid-outline' },
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

  protected onNavigate(): void {
    this.navigate.emit();
  }
}
