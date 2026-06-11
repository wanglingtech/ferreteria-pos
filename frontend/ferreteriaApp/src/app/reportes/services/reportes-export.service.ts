import { Injectable } from '@angular/core';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';

@Injectable({ providedIn: 'root' })
export class ReportesExportService {
  /**
   * Exporta el reporte a CSV (con separador punto y coma y UTF-8 BOM)
   */
  exportToCSV(
    reporte: ReporteGeneral,
    ventasPorDia: VentaPorDia[],
    from: string,
    to: string,
    userFullName: string = 'Usuario',
  ): void {
    const rows: string[][] = [
      ['Reporte generado por:', userFullName],
      ['Período:', `${from} al ${to}`],
      ['Fecha de generación:', new Date().toLocaleString()],
      [],
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

  /**
   * Exporta el reporte a PDF (ventana de impresión) con diseño profesional y controles de salto de página.
   */
  exportToPDF(
    reporte: ReporteGeneral,
    ventasPorDia: VentaPorDia[],
    from: string,
    to: string,
    logoUrl: string,
    userFullName: string = 'Usuario',
  ): void {
    if (!reporte || !ventasPorDia) {
      throw new Error('Datos insuficientes para generar el PDF');
    }

    // Datos de la empresa (puedes modificarlos)
    const company = {
      name: 'Ferretería July',
      ruc: '20601234567',
      address: 'Av. Principal 123, Lima - Perú',
      phone: '(01) 234-5678',
      email: 'ventas@ferreteriajuly.com',
      web: 'www.ferreteriajuly.com',
    };

    const periodo = `Del ${from} al ${to}`;
    const fechaGeneracion = new Date().toLocaleString('es-PE', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    // Construir filas de ventas diarias
    const ventasDiarias = ventasPorDia.length
      ? ventasPorDia
          .map(
            (v) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${v.date}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${this.formatCurrency(v.total)}</td>
        </tr>
      `,
          )
          .join('')
      : '<tr><td colspan="2" style="padding: 16px; text-align: center;">No hay ventas en este período</td></tr>';

    // Construir filas de top productos
    const topProductosRows = reporte.topProductos.length
      ? reporte.topProductos
          .map(
            (p) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.sku}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.nombre}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${p.cantidadVendida}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${this.formatCurrency(p.totalVendido)}</td>
        </tr>
      `,
          )
          .join('')
      : '<tr><td colspan="4" style="padding: 16px; text-align: center;">No hay productos vendidos</td></tr>';

    // HTML con estilos mejorados y control de saltos de página
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Ventas - ${company.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: white;
          }
          .report-container {
            max-width: 1100px;
            margin: 0 auto;
            background: white;
          }
          /* Encabezado - no rompe */
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #0a1a5c;
            page-break-after: avoid;
          }
          .logo {
            max-width: 100px;
            margin-bottom: 10px;
            border-radius: 12px;
          }
          .company-name {
            font-size: 28px;
            font-weight: 800;
            color: #0a1a5c;
            margin: 5px 0;
          }
          .company-info {
            font-size: 11px;
            color: #475569;
            margin: 3px 0;
          }
          .report-title {
            font-size: 22px;
            font-weight: 700;
            color: #0a1a5c;
            margin: 12px 0 5px;
          }
          .periodo, .generated-by {
            font-size: 12px;
            color: #475569;
            margin: 3px 0;
          }
          /* KPIs */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin: 25px 0;
            page-break-inside: avoid;
          }
          .kpi-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 16px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .kpi-card strong {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #0a1a5c;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .kpi-value {
            font-size: 22px;
            font-weight: 800;
            color: #0a1a5c;
          }
          /* Secciones: título + tabla se mantienen juntos */
          .section {
            margin: 25px 0 20px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #0a1a5c;
            margin: 0 0 10px 0;
            padding-left: 10px;
            border-left: 4px solid #f97316;
            page-break-after: avoid;
          }
          /* Tablas */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 20px 0;
            font-size: 13px;
            page-break-inside: avoid;
          }
          th {
            background: #f1f5f9;
            color: #0a1a5c;
            font-weight: 700;
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          /* Pie de página */
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 12px;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            page-break-before: avoid;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            .kpi-card, .section, table, .header, .footer {
              break-inside: avoid;
            }
            .section-title {
              break-after: avoid;
            }
            table {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Encabezado -->
          <div class="header">
            <img src="${logoUrl}" alt="Logo ${company.name}" class="logo" onerror="this.style.display='none'">
            <div class="company-name">${company.name}</div>
            <div class="company-info">RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone} | ${company.email}</div>
            <div class="report-title">Reporte de Ventas</div>
            <div class="periodo">📅 ${periodo}</div>
            <div class="generated-by">👤 Generado por: ${userFullName} | 📆 ${fechaGeneracion}</div>
          </div>

          <!-- KPIs -->
          <div class="kpi-grid">
            <div class="kpi-card"><strong>Ventas Totales</strong><div class="kpi-value">${this.formatCurrency(reporte.ventasTotales)}</div></div>
            <div class="kpi-card"><strong>Total Órdenes</strong><div class="kpi-value">${reporte.totalOrdenes}</div></div>
            <div class="kpi-card"><strong>Ticket Promedio</strong><div class="kpi-value">${this.formatCurrency(reporte.ticketPromedio)}</div></div>
            <div class="kpi-card"><strong>Subtotal</strong><div class="kpi-value">${this.formatCurrency(reporte.subtotalTotal)}</div></div>
            <div class="kpi-card"><strong>IGV (18%)</strong><div class="kpi-value">${this.formatCurrency(reporte.igvTotal)}</div></div>
            <div class="kpi-card"><strong>Clientes Atendidos</strong><div class="kpi-value">${reporte.clientesAtendidos}</div></div>
          </div>

          <!-- Ventas por día (sección con título y tabla juntos) -->
          <div class="section">
          <br>
            <div class="section-title">📊 Evolución de Ventas por Día</div>
            <table>
              <thead>
                <tr><th>Fecha</th><th class="text-right">Total</th></tr>
              </thead>
              <tbody>${ventasDiarias}</tbody>
            </table>
          </div>

          <!-- Top productos (sección con título y tabla juntos) -->
          <div class="section">
           <br>
            <div class="section-title">🏆 Top Productos Más Vendidos</div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-right">Total Vendido</th>
                </tr>
              </thead>
              <tbody>${topProductosRows}</tbody>
            </table>
          </div>

          <!-- Pie de página -->
          <div class="footer">
            Este reporte es confidencial y ha sido generado automáticamente por el sistema Ferretería July.
            Para consultas, contacte a soporte@ferreteriajuly.com
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error(
        'No se pudo abrir la ventana de impresión. Permita ventanas emergentes para este sitio.',
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
