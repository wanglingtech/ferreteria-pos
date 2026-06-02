// Producto utilizado en la búsqueda (viene desde productos-api)
export interface ProductoParaVenta {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
}

// Ítem del carrito (extiende ProductoParaVenta con cantidad)
export interface CartItem extends ProductoParaVenta {
  cantidad: number;
}

// Request para crear una venta (lo que espera el backend)
export interface CreateVentaRequest {
  clienteNombre?: string;
  items: {
    productoId: number;
    cantidad: number;
  }[];
}

// Respuesta del backend para una venta (listado/detalle)
export interface VentaItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface Venta {
  id: number;
  code: string;
  customerName: string | null;
  subtotal: number;
  igv: number;
  total: number;
  createdAt: string;
  sellerId: number;
  seller: {
    id: number;
    fullName: string;
    username: string;
  };
  items: VentaItem[];
}
