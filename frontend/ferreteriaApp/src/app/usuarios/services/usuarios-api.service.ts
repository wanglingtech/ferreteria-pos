import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import {
  Usuario,
  CreateUsuarioRequest,
  UpdateStatusRequest,
  UpdateUsuarioRequest,
} from '../interfaces/usuario.interface';

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly usuariosBaseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponse<Usuario[]>>(`${this.usuariosBaseUrl}`)
      .pipe(map((response) => response.data));
  }

  crear(payload: CreateUsuarioRequest): Observable<Usuario> {
    return this.http
      .post<ApiResponse<Usuario>>(`${this.usuariosBaseUrl}`, payload)
      .pipe(map((response) => response.data));
  }

  cambiarEstado(id: number, payload: UpdateStatusRequest): Observable<Usuario> {
    return this.http
      .patch<
        ApiResponse<Usuario>
      >(`${this.usuariosBaseUrl}/${id}/status`, payload)
      .pipe(map((response) => response.data));
  }

  actualizar(id: number, payload: UpdateUsuarioRequest): Observable<Usuario> {
    return this.http
      .put<ApiResponse<Usuario>>(`${this.usuariosBaseUrl}/${id}`, payload)
      .pipe(map((response) => response.data));
  }
}
