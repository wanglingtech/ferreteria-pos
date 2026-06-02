import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import {
  Producto,
  CreateProductoRequest,
  UpdateProductoRequest,
} from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class ProductosApiService {
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // Listar con filtros
  listar(filters: {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
  }): Observable<Producto[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId !== undefined)
      params = params.set('categoryId', filters.categoryId);
    if (filters.isActive !== undefined)
      params = params.set('isActive', filters.isActive);
    return this.http
      .get<ApiResponse<Producto[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  // Obtener uno
  obtener(id: number): Observable<Producto> {
    return this.http
      .get<ApiResponse<Producto>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  // Crear (solo admin)
  crear(payload: CreateProductoRequest): Observable<Producto> {
    return this.http
      .post<ApiResponse<Producto>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  // Actualizar (solo admin)
  actualizar(id: number, payload: UpdateProductoRequest): Observable<Producto> {
    return this.http
      .patch<ApiResponse<Producto>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  // Eliminar (desactivar, solo admin)
  eliminar(id: number): Observable<Producto> {
    return this.http
      .delete<ApiResponse<Producto>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
