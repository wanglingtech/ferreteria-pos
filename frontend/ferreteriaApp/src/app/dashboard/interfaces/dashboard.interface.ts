export interface Kpis {
  ventasDia: number;
  ordenesDia: number;
  productosTotales: number;
  productosStockBajo: number;
}

export interface SalesDay {
  date: string; // formato 'YYYY-MM-DD'
  total: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
}

export interface RecentSale {
  id: number;
  code: string;
  total: number;
  createdAt: string;
  seller: { fullName: string };
  items: Array<{ quantity: number; product: { name: string } }>;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
}

export interface DashboardData {
  kpis: Kpis;
  salesLast7Days: SalesDay[];
  topProducts: TopProduct[];
  recentActivity: RecentSale[];
  lowStockAlerts: LowStockProduct[];
}
