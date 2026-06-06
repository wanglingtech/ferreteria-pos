// src/app/reportes/interfaces/reportes.interface.ts
export interface ReporteGeneral {
  ventasTotales: number;
  subtotalTotal: number;
  igvTotal: number;
  totalOrdenes: number;
  ticketPromedio: number;
  clientesAtendidos: number;
  topProductos: TopProducto[];
}

export interface TopProducto {
  productId: number;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
}

export interface VentaPorDia {
  date: string;
  total: number;
}
