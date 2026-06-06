import { Injectable } from '@angular/core';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';

@Injectable({ providedIn: 'root' })
export class ReportesExportService {
  exportToCSV(
    reporte: ReporteGeneral,
    ventasPorDia: VentaPorDia[],
    from: string,
    to: string,
  ): void {
    const rows: string[][] = [
      ['Métrica', 'Valor'],
      ['Ventas Totales', this.formatCurrency(reporte.ventasTotales)],
      ['Subtotal', this.formatCurrency(reporte.subtotalTotal)],
      ['IGV', this.formatCurrency(reporte.igvTotal)],
      ['Total Órdenes', reporte.totalOrdenes.toString()],
      ['Ticket Promedio', this.formatCurrency(reporte.ticketPromedio)],
      ['Clientes Atendidos', reporte.clientesAtendidos.toString()],
      [],
      ['Top Productos'],
      [
        'SKU',
        'Producto',
        'Cantidad',
        'Total Vendido',
        'Precio Promedio',
        '% Participación',
      ],
    ];

    const totalVentas = reporte.ventasTotales;
    reporte.topProductos.forEach((p) => {
      const precioPromedio =
        p.cantidadVendida > 0 ? p.totalVendido / p.cantidadVendida : 0;
      const participacion =
        totalVentas > 0 ? (p.totalVendido / totalVentas) * 100 : 0;
      rows.push([
        p.sku,
        p.nombre,
        p.cantidadVendida.toString(),
        this.formatCurrency(p.totalVendido),
        this.formatCurrency(precioPromedio),
        participacion.toFixed(2) + '%',
      ]);
    });

    const csvContent = rows.map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reporte_${from}_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportToPDF(
    reporte: ReporteGeneral,
    ventasPorDia: VentaPorDia[],
    from: string,
    to: string,
    logoUrl: string,
  ): void {
    const ventasDiarias = ventasPorDia
      .map(
        (v) => `
      <tr><td>${v.date}</td><td>${this.formatCurrency(v.total)}</td></tr>
    `,
      )
      .join('');
    const topProductosRows = reporte.topProductos
      .map(
        (p) => `
      <tr>
        <td>${p.sku}</td>
        <td>${p.nombre}</td>
        <td>${p.cantidadVendida}</td>
        <td>${this.formatCurrency(p.totalVendido)}</td>
      </tr>
    `,
      )
      .join('');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Ventas</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 120px; margin-bottom: 10px; }
          h1 { color: #0a1a5c; margin: 0; }
          .periodo { color: #475569; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background: #f1f5f9; color: #0a1a5c; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 15px; margin: 20px 0; }
          .kpi-card { background: #f8fafc; border-radius: 16px; padding: 15px; text-align: center; border: 1px solid #e2e8f0; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #0a1a5c; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Logo">
          <h1>Reporte de Ventas</h1>
          <div class="periodo">Período: ${from} al ${to}</div>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card"><strong>Ventas Totales</strong><div class="kpi-value">${this.formatCurrency(reporte.ventasTotales)}</div></div>
          <div class="kpi-card"><strong>Total Órdenes</strong><div class="kpi-value">${reporte.totalOrdenes}</div></div>
          <div class="kpi-card"><strong>Ticket Promedio</strong><div class="kpi-value">${this.formatCurrency(reporte.ticketPromedio)}</div></div>
        </div>
        <h3>📈 Ventas por día</h3>
        <table><thead><tr><th>Fecha</th><th>Total</th></tr></thead><tbody>${ventasDiarias}</tbody></table>
        <h3>🏆 Top Productos Más Vendidos</h3>
        <table><thead><tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Total Vendido</th></tr></thead><tbody>${topProductosRows}</tbody></table>
        <div class="footer">Reporte generado el ${new Date().toLocaleString()} - Ferretería July</div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      throw new Error('No se pudo abrir la ventana de impresión');
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
