import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { Usuario, CreateUsuarioRequest, UpdateStatusRequest } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root',
})
export class UsuariosApiService {
  private readonly usuariosBaseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtener lista de todos los usuarios (solo ADMIN)
   */
  listar(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponse<Usuario[]>>(`${this.usuariosBaseUrl}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Crear nuevo usuario (solo ADMIN)
   */
  crear(payload: CreateUsuarioRequest): Observable<Usuario> {
    return this.http
      .post<ApiResponse<Usuario>>(`${this.usuariosBaseUrl}`, payload)
      .pipe(map((response) => response.data));
  }

  /**
   * Cambiar estado de usuario activo/inactivo (solo ADMIN)
   */
  cambiarEstado(id: number, payload: UpdateStatusRequest): Observable<Usuario> {
    return this.http
      .patch<ApiResponse<Usuario>>(`${this.usuariosBaseUrl}/${id}/status`, payload)
      .pipe(map((response) => response.data));
  }
}
