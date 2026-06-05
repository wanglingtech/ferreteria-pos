export interface ResumenInventario {
  totalProductos: number;
  productosStockBajo: number;
  productosSinStock: number;
  valorizacionTotal: number;
}

export interface ProductoCritico {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  imageUrl?: string;
  category?: { name: string } | null;
}
