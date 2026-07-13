// ============================================================
// SERVICIO CHART SERVICE - VERSIÓN COMPLETA
// Centraliza la creación y gestión de gráficos con Chart.js.
// Proporciona métodos para crear, actualizar, destruir y redimensionar gráficos.
// ============================================================

import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js (necesario una sola vez)
Chart.register(...registerables);

@Injectable({ providedIn: 'root' })
export class ChartService {
  /**
   * Almacena las instancias activas de gráficos, identificadas por un string único.
   * Permite gestionar múltiples gráficos en diferentes componentes.
   */
  private charts: Map<string, Chart> = new Map();

  // ============================================================
  // 1. OPCIONES PREDETERMINADAS PARA GRÁFICOS
  // ============================================================

  /**
   * Opciones comunes para gráficos de línea y barras (usadas en dashboard).
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
   * Opciones para gráficos de barras con escalas personalizadas (usado en reportes).
   */
  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} unidades`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  /**
   * Opciones para gráficos de líneas con formato de moneda en tooltips (usado en reportes).
   */
  readonly lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `S/ ${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (val) => `S/ ${val}` } },
    },
  };

  // ============================================================
  // 2. MÉTODOS PRINCIPALES
  // ============================================================

  /**
   * Crea un nuevo gráfico y lo almacena en el mapa.
   * @param id Identificador único del gráfico (ej: 'salesChart').
   * @param canvasId ID del elemento canvas donde se renderizará.
   * @param type Tipo de gráfico ('line', 'bar', 'doughnut', etc.).
   * @param data Datos del gráfico (labels, datasets).
   * @param options Opciones personalizadas (opcional, fusiona con las predeterminadas).
   * @returns La instancia del gráfico creado.
   */
  createChart(
    id: string,
    canvasId: string,
    type: ChartType,
    data: any,
    options?: ChartConfiguration['options'],
  ): Chart {
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

    // Si ya existe un gráfico con este id, destruirlo primero
    if (this.charts.has(id)) {
      this.destroyChart(id);
    }

    // Fusionar opciones predeterminadas con las personalizadas
    const mergedOptions = this.mergeOptions(type, options);

    // Crear el gráfico
    const chart = new Chart(ctx, {
      type,
      data,
      options: mergedOptions,
    });

    this.charts.set(id, chart);
    return chart;
  }

  /**
   * Actualiza los datos de un gráfico existente sin recrearlo.
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
    chart.update();
  }

  /**
   * Destruye un gráfico y lo elimina del mapa.
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
   * Redimensiona un gráfico (útil cuando el contenedor cambia de tamaño).
   * @param id Identificador del gráfico.
   */
  resizeChart(id: string): void {
    const chart = this.charts.get(id);
    if (chart) {
      chart.resize();
    }
  }

  /**
   * Destruye todos los gráficos activos (útil al destruir el componente).
   */
  destroyAll(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  /**
   * Obtiene una instancia de gráfico por su id.
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
   * Fusiona opciones según el tipo de gráfico.
   */
  private mergeOptions(
    type: ChartType,
    customOptions?: ChartConfiguration['options'],
  ): ChartConfiguration['options'] {
    let baseOptions: ChartConfiguration['options'];

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

    if (customOptions) {
      return { ...baseOptions, ...customOptions };
    }
    return baseOptions;
  }
}
