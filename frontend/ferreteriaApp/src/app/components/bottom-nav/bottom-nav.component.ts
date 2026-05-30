import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { CommonModule } from '@angular/common';

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
export class BottomNavComponent implements AfterViewInit {
  @ViewChild('scrollContainer')
  scrollContainer!: ElementRef<HTMLDivElement>;

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

  ngAfterViewInit(): void {
    const slider = this.scrollContainer.nativeElement;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;

      e.preventDefault();

      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;

      slider.scrollLeft = scrollLeft - walk;
    });
  }
}
