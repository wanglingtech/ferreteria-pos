// ============================================================
// BOTTOM NAV COMPONENT - NAVEGACIÓN INFERIOR DINÁMICA
// ============================================================
// Este componente renderiza el menú de navegación inferior.
// Muestra diferentes opciones según el rol del usuario:
// - ADMIN: ve todos los módulos (Dashboard, Productos, Ventas, Inventario, Usuarios, Reportes)
// - SELLER: solo ve Productos y Ventas.
// Además, implementa scroll horizontal con arrastre (drag) para pantallas táctiles/mouse.
// ============================================================

import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit, // Se ejecuta después de que la vista esté completamente renderizada
  computed, // Señal computada que se recalcula automáticamente cuando sus dependencias cambian
  inject, // Nueva forma de inyectar dependencias sin constructor
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Directivas para enrutamiento
import { IonFooter, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Para registrar iconos de Ionicons
import {
  barChartOutline,
  basketOutline,
  cubeOutline,
  gridOutline,
  layersOutline,
  peopleOutline,
} from 'ionicons/icons';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-bottom-nav', // Etiqueta HTML para usar este componente
  standalone: true, // Es un componente standalone (no necesita NgModule)
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  imports: [
    CommonModule, // Directivas comunes (*ngIf, *ngFor, etc.)
    RouterLink, // Para enlaces de navegación (routerLink)
    RouterLinkActive, // Para aplicar clase activa en el enlace actual
    IonFooter, // Componente Ionic para el pie de página
    IonIcon, // Componente Ionic para iconos
  ],
})
export class BottomNavComponent implements AfterViewInit {
  // ============================================================
  // 1. REFERENCIAS A ELEMENTOS DEL DOM
  // ============================================================
  /**
   * Referencia al contenedor del menú para implementar scroll horizontal con arrastre.
   * Se usa `ViewChild` para obtener el elemento HTML con la referencia #scrollContainer.
   * El tipo `ElementRef<HTMLDivElement>` garantiza que es un div.
   */
  @ViewChild('scrollContainer')
  scrollContainer!: ElementRef<HTMLDivElement>;

  // ============================================================
  // 2. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  /**
   * Servicio de autenticación para obtener el usuario actual y su rol.
   * Usamos `inject()` en lugar de inyección por constructor (más moderno).
   */
  private authService = inject(AuthSessionService);

  // ============================================================
  // 3. DEFINICIÓN DE LOS ÍTEMS DEL MENÚ
  // ============================================================
  /**
   * Lista completa de todos los módulos disponibles en el sistema.
   * Cada item tiene:
   * - label: texto visible
   * - path: ruta de navegación
   * - icon: nombre del icono de Ionicons
   */
  private allItems = [
    { label: 'Inicio', path: '/app/dashboard', icon: 'grid-outline' },
    { label: 'Productos', path: '/app/productos', icon: 'cube-outline' },
    { label: 'Ventas', path: '/app/ventas', icon: 'basket-outline' },
    { label: 'Inventario', path: '/app/inventario', icon: 'layers-outline' },
    { label: 'Usuarios', path: '/app/usuarios', icon: 'people-outline' },
    { label: 'Reportes', path: '/app/reportes', icon: 'bar-chart-outline' },
  ];

  // ============================================================
  // 4. SEÑAL COMPUTADA: FILTRADO DE ÍTEMS SEGÚN ROL
  // ============================================================
  /**
   * Señal computada que devuelve los items que debe mostrar el menú.
   * Se recalcula automáticamente cuando cambia el usuario (o su rol).
   *
   * ¿Por qué es una señal?
   * - Es reactiva: si el usuario cambia (ej. cierra sesión o cambia de rol),
   *   el menú se actualiza automáticamente sin necesidad de recargar la página.
   * - Es eficiente: solo se recalcula cuando sus dependencias (getCurrentUser()) cambian.
   *
   * Lógica de filtrado:
   * - ADMIN: muestra todos los items (6)
   * - SELLER: solo muestra Productos y Ventas (2)
   * - Si no hay usuario (fallback), asumimos SELLER para seguridad.
   */
  protected readonly items = computed(() => {
    // Obtener el usuario actual desde el servicio de autenticación
    const user = this.authService.getCurrentUser();
    const role = user?.role;

    // Si es ADMIN, mostrar todos los items
    if (role === 'ADMIN') {
      return this.allItems;
    } else {
      // Si es SELLER o no hay usuario, mostrar solo Productos y Ventas
      // (Los vendedores no deben ver módulos administrativos)
      return this.allItems.filter(
        (item) => item.path === '/app/productos' || item.path === '/app/ventas',
      );
    }
  });

  // ============================================================
  // 5. CONSTRUCTOR: REGISTRO DE ICONOS
  // ============================================================
  /**
   * En el constructor registramos los iconos que se usarán en el template.
   * `addIcons` es una función de Ionic que asocia el nombre del icono con su definición.
   * Esto permite usar <ion-icon name="grid-outline"></ion-icon> en el HTML.
   */
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

  // ============================================================
  // 6. CICLO DE VIDA: CONFIGURACIÓN DEL SCROLL CON ARRASTRE
  // ============================================================
  /**
   * ngAfterViewInit se ejecuta cuando la vista del componente ya está renderizada.
   * Aquí configuramos la lógica para que el menú se pueda desplazar horizontalmente
   * con el mouse (drag), imitando el comportamiento de un carrusel táctil.
   *
   * ¿Cómo funciona?
   * - Al hacer clic (mousedown), guardamos la posición inicial y el scroll actual.
   * - Al mover el mouse (mousemove), calculamos la distancia recorrida y ajustamos
   *   el scroll para que el menú se desplace en sincronía con el movimiento del mouse.
   * - Al soltar (mouseup) o salir del contenedor (mouseleave), detenemos el arrastre.
   *
   * Esto mejora la experiencia en escritorio, donde no hay gestos táctiles.
   */
  ngAfterViewInit(): void {
    // Obtener el elemento contenedor del menú (div con #scrollContainer)
    const slider = this.scrollContainer.nativeElement;

    // Variables de estado para el arrastre
    let isDown = false; // Indica si el mouse está presionado
    let startX = 0; // Posición X donde se hizo clic
    let scrollLeft = 0; // Posición de scroll al momento del clic

    // -------------------------------------------------------------------
    // 6a. Evento: Mouse presionado (inicia el arrastre)
    // -------------------------------------------------------------------
    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft; // Posición del mouse relativa al contenedor
      scrollLeft = slider.scrollLeft; // Guardamos la posición actual del scroll
    });

    // -------------------------------------------------------------------
    // 6b. Evento: Mouse sale del contenedor (detiene el arrastre)
    // -------------------------------------------------------------------
    slider.addEventListener('mouseleave', () => {
      isDown = false; // Si el mouse sale, cancelamos el arrastre
    });

    // -------------------------------------------------------------------
    // 6c. Evento: Mouse soltado (termina el arrastre)
    // -------------------------------------------------------------------
    slider.addEventListener('mouseup', () => {
      isDown = false; // Al soltar, detenemos el arrastre
    });

    // -------------------------------------------------------------------
    // 6d. Evento: Mouse se mueve (ejecuta el scroll)
    // -------------------------------------------------------------------
    slider.addEventListener('mousemove', (e) => {
      // Si no está presionado, no hacemos nada
      if (!isDown) return;

      // Prevenir la selección de texto mientras se arrastra
      e.preventDefault();

      // Calcular la posición actual del mouse
      const x = e.pageX - slider.offsetLeft;
      // Calcular la distancia recorrida desde que se presionó (multiplicada por 2 para mayor sensibilidad)
      const walk = (x - startX) * 2;
      // Aplicar el desplazamiento al scroll
      slider.scrollLeft = scrollLeft - walk;
    });
  }
}
