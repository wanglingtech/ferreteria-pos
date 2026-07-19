// ============================================================
// SERVICIO CHART SERVICE - VERSIÓN COMPLETA Y CORREGIDA
// ============================================================
// Centraliza la creación y gestión de gráficos con Chart.js.
// Proporciona métodos para crear, actualizar, destruir y redimensionar gráficos.
//
// ¿Por qué es útil?
// - Evita duplicar código en cada componente que necesite gráficos.
// - Mantiene un registro de todos los gráficos activos para poder destruirlos al salir de la página.
// - Centraliza las opciones de estilo (colores, tooltips, escalas) para mantener consistencia.
// ============================================================

import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js (necesario una sola vez)
// Esto incluye escalas, controladores, plugins, etc.
Chart.register(...registerables);

@Injectable({ providedIn: 'root' })
export class ChartService {
  /**
   * Almacena las instancias activas de gráficos, identificadas por un string único.
   * Permite gestionar múltiples gráficos en diferentes componentes.
   *
   * Ejemplo de uso:
   *   this.charts.set('ventasMensuales', chartInstance);
   *   this.charts.get('ventasMensuales') → devuelve la instancia
   */
  private charts: Map<string, Chart> = new Map();

  // ============================================================
  // 1. OPCIONES PREDETERMINADAS PARA GRÁFICOS
  // ============================================================
  // Cada conjunto de opciones se puede reutilizar en diferentes gráficos del mismo tipo.
  // Se fusionan con opciones personalizadas que pase el componente al crear el gráfico.

  /**
   * Opciones comunes para gráficos de línea y barras (usadas en dashboard).
   * - responsive: se adapta al contenedor.
   * - maintainAspectRatio: mantiene la relación de aspecto.
   * - aspectRatio: ancho/alto (1.5 es estándar).
   * - legend: posición y tamaño de fuente.
   * - tooltip: muestra información al pasar el cursor.
   * - scales: define ejes Y (empieza en cero) y X (sin líneas de cuadrícula).
   */
  readonly defaultChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 10 } } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
      x: { grid: { display: false } },
    },
  };

  /**
   * Opciones para gráficos de dona (doughnut) con aspecto cuadrado.
   * - aspectRatio: 1.2 (casi cuadrado).
   * - legend: en la parte superior.
   */
  readonly doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 10 } } },
    },
  };

  /**
   * Opciones para gráficos de barras (usado en reportes).
   * - tooltip personalizado: muestra unidades.
   * - escala Y con stepSize = 1 (para que los ticks sean números enteros).
   */
  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          // AQUÍ ESTABA EL ERROR: context.parsed.y podría ser null.
          // Lo corregimos con una comprobación segura.
          label: (context) => {
            // Verificamos que context.parsed y context.parsed.y existan y no sean null
            if (
              context.parsed &&
              context.parsed.y !== null &&
              context.parsed.y !== undefined
            ) {
              return `${context.parsed.y} unidades`;
            }
            return '0 unidades'; // valor por defecto si no hay datos
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  /**
   * Opciones para gráficos de líneas (usado en reportes de ventas).
   * - tooltip personalizado: muestra valores en formato moneda (S/).
   * - escala Y con callback para mostrar el símbolo de moneda.
   */
  readonly lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          // AQUÍ TAMBIÉN ESTABA EL ERROR: context.parsed.y podría ser null.
          // Lo corregimos con una comprobación segura.
          label: (context) => {
            // Verificamos que el valor exista y no sea null
            if (
              context.parsed &&
              context.parsed.y !== null &&
              context.parsed.y !== undefined
            ) {
              return `S/ ${context.parsed.y.toFixed(2)}`;
            }
            return 'S/ 0.00'; // valor por defecto
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `S/ ${val}`, // Muestra el símbolo de moneda en el eje Y
        },
      },
    },
  };

  // ============================================================
  // 2. MÉTODOS PRINCIPALES
  // ============================================================

  /**
   * Crea un nuevo gráfico y lo almacena en el mapa.
   *
   * @param id Identificador único del gráfico (ej: 'salesChart'). Se usa para recuperarlo después.
   * @param canvasId ID del elemento canvas donde se renderizará (debe existir en el DOM).
   * @param type Tipo de gráfico ('line', 'bar', 'doughnut', etc.).
   * @param data Datos del gráfico (labels, datasets).
   * @param options Opciones personalizadas (opcional, fusiona con las predeterminadas).
   * @returns La instancia del gráfico creado.
   *
   * Ejemplo:
   *   this.chartService.createChart('ventas', 'ventasCanvas', 'line', data, { ... });
   */
  createChart(
    id: string,
    canvasId: string,
    type: ChartType,
    data: any,
    options?: ChartConfiguration['options'],
  ): Chart {
    // Buscar el elemento canvas en el DOM
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas con id "${canvasId}" no encontrado`);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(
        `No se pudo obtener el contexto 2D del canvas "${canvasId}"`,
      );
    }

    // Si ya existe un gráfico con este id, destruirlo primero (evita duplicados)
    if (this.charts.has(id)) {
      this.destroyChart(id);
    }

    // Fusionar opciones predeterminadas con las personalizadas
    const mergedOptions = this.mergeOptions(type, options);

    // Crear el gráfico usando Chart.js
    const chart = new Chart(ctx, {
      type,
      data,
      options: mergedOptions,
    });

    // Guardar la instancia en el mapa para referencia futura
    this.charts.set(id, chart);
    return chart;
  }

  /**
   * Actualiza los datos de un gráfico existente sin recrearlo.
   * Útil cuando los datos cambian (ej: filtros por fecha).
   *
   * @param id Identificador del gráfico.
   * @param data Nuevos datos (labels, datasets).
   */
  updateChartData(id: string, data: any): void {
    const chart = this.charts.get(id);
    if (!chart) {
      console.warn(`Gráfico con id "${id}" no encontrado para actualizar.`);
      return;
    }
    chart.data = data;
    chart.update(); // Vuelve a renderizar con los nuevos datos
  }

  /**
   * Destruye un gráfico y lo elimina del mapa.
   * Es importante llamar a destroy() para liberar memoria y evitar fugas.
   *
   * @param id Identificador del gráfico.
   */
  destroyChart(id: string): void {
    const chart = this.charts.get(id);
    if (chart) {
      chart.destroy();
      this.charts.delete(id);
    }
  }

  /**
   * Redimensiona un gráfico (útil cuando el contenedor cambia de tamaño, ej: al redimensionar la ventana).
   *
   * @param id Identificador del gráfico.
   */
  resizeChart(id: string): void {
    const chart = this.charts.get(id);
    if (chart) {
      chart.resize();
    }
  }

  /**
   * Destruye todos los gráficos activos (útil al destruir el componente para limpiar todo).
   */
  destroyAll(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  /**
   * Obtiene una instancia de gráfico por su id.
   *
   * @param id Identificador del gráfico.
   * @returns La instancia o undefined si no existe.
   */
  getChart(id: string): Chart | undefined {
    return this.charts.get(id);
  }

  // ============================================================
  // 3. MÉTODOS PRIVADOS DE AYUDA
  // ============================================================

  /**
   * Fusiona las opciones base según el tipo de gráfico con las opciones personalizadas.
   *
   * @param type Tipo de gráfico ('line', 'bar', 'doughnut', etc.)
   * @param customOptions Opciones proporcionadas por el componente (pueden ser parciales)
   * @returns Opciones combinadas.
   */
  private mergeOptions(
    type: ChartType,
    customOptions?: ChartConfiguration['options'],
  ): ChartConfiguration['options'] {
    let baseOptions: ChartConfiguration['options'];

    // Seleccionar las opciones base según el tipo
    switch (type) {
      case 'line':
        baseOptions = this.lineChartOptions;
        break;
      case 'bar':
        baseOptions = this.barChartOptions;
        break;
      case 'doughnut':
        baseOptions = this.doughnutOptions;
        break;
      default:
        baseOptions = this.defaultChartOptions;
        break;
    }

    // Si hay opciones personalizadas, fusionarlas (sobrescriben las base)
    if (customOptions) {
      return { ...baseOptions, ...customOptions };
    }
    return baseOptions;
  }
}
