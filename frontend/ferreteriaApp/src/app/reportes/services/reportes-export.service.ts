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
    // Validar datos mínimos
    if (!reporte || !ventasPorDia) {
      throw new Error('Datos insuficientes para generar el PDF');
    }

    // Formatear fechas para el título
    const periodo = `Período: ${from} al ${to}`;
    const fechaGeneracion = new Date().toLocaleString();

    // Construir filas de ventas diarias
    const ventasDiarias = ventasPorDia.length
      ? ventasPorDia
          .map(
            (v) =>
              `<td><td>${v.date}</td><td>${this.formatCurrency(v.total)}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2">No hay ventas en este período</td></tr>';

    // Construir filas de top productos
    const topProductosRows = reporte.topProductos.length
      ? reporte.topProductos
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
          .join('')
      : '<tr><td colspan="4">No hay productos vendidos</td></tr>';

    // HTML para el PDF (con estilo profesional)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Ventas - Ferretería July</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 20px;
            color: #1e293b;
            background: white;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .logo {
            max-width: 100px;
            margin-bottom: 10px;
            border-radius: 12px;
          }
          h1 { color: #0a1a5c; margin: 5px 0; font-size: 24px; }
          .periodo { color: #475569; margin-bottom: 25px; font-size: 14px; }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 25px 0;
          }
          .kpi-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 15px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .kpi-card strong { display: block; font-size: 14px; color: #0a1a5c; margin-bottom: 8px; }
          .kpi-value { font-size: 22px; font-weight: bold; color: #0a1a5c; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f1f5f9;
            color: #0a1a5c;
            font-weight: 700;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .kpi-card { break-inside: avoid; }
            table { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'">
          <h1>Reporte de Ventas</h1>
          <div class="periodo">${periodo}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><strong>Ventas Totales</strong><div class="kpi-value">${this.formatCurrency(reporte.ventasTotales)}</div></div>
          <div class="kpi-card"><strong>Total Órdenes</strong><div class="kpi-value">${reporte.totalOrdenes}</div></div>
          <div class="kpi-card"><strong>Ticket Promedio</strong><div class="kpi-value">${this.formatCurrency(reporte.ticketPromedio)}</div></div>
        </div>

        <h3>📈 Ventas por día</h3>
        <table>
          <thead><tr><th>Fecha</th><th>Total</th></tr></thead>
          <tbody>${ventasDiarias}</tbody>
        </table>

        <h3>🏆 Top Productos Más Vendidos</h3>
        <table>
          <thead><tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Total Vendido</th></tr></thead>
          <tbody>${topProductosRows}</tbody>
        </table>

        <div class="footer">Reporte generado el ${fechaGeneracion} - Ferretería July</div>
      </body>
      </html>
    `;

    // Abrir ventana e imprimir
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error(
        'No se pudo abrir la ventana de impresión. Por favor, permita ventanas emergentes para este sitio.',
      );
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
