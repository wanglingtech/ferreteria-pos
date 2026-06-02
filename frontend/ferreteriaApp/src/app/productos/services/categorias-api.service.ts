import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { Categoria } from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class CategoriasApiService {
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  /**
   * Listar categorías (activas o todas)
   * @param soloActivas si es true, filtra solo las activas
   */
  listar(soloActivas: boolean = false): Observable<Categoria[]> {
    let params = new HttpParams();
    if (soloActivas) {
      params = params.set('isActive', 'true');
    }
    return this.http
      .get<ApiResponse<Categoria[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Obtener solo categorías activas (alias de listar con filtro)
   */
  listarActivas(): Observable<Categoria[]> {
    return this.listar(true);
  }

  /**
   * Crear una nueva categoría (solo ADMIN)
   * @param payload objeto con { nombre: string }
   */
  crear(payload: { nombre: string }): Observable<Categoria> {
    return this.http
      .post<ApiResponse<Categoria>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Actualizar una categoría existente (solo ADMIN)
   * @param id ID de la categoría
   * @param payload objeto con campos a actualizar (nombre, isActive)
   */
  actualizar(
    id: number,
    payload: { nombre?: string; isActive?: boolean },
  ): Observable<Categoria> {
    return this.http
      .patch<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Eliminar (desactivar) una categoría (solo ADMIN)
   * @param id ID de la categoría
   */
  eliminar(id: number): Observable<Categoria> {
    return this.http
      .delete<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
