export interface Categoria {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Producto {
  id: number;
  sku: string;
  name: string; // en backend es 'name'
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId?: number;
  category?: Categoria;
}

// Para crear (admin)
export interface CreateProductoRequest {
  sku: string;
  nombre: string; // así lo espera el backend en el schema
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoriaId?: number | null;
  imagenUrl?: string;
}

// Para actualizar (todos opcionales excepto SKU? backend acepta parcial)
export interface UpdateProductoRequest {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  stockMinimo?: number;
  categoriaId?: number | null;
  imagenUrl?: string;
}
