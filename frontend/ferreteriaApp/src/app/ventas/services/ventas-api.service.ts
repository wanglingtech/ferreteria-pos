import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { Venta, CreateVentaRequest } from '../interfaces/venta.interface';

@Injectable({ providedIn: 'root' })
export class VentasApiService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  /**
   * Listar todas las ventas (con filtros opcionales)
   */
  listar(filters?: {
    startDate?: string;
    endDate?: string;
  }): Observable<Venta[]> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    return this.http
      .get<ApiResponse<Venta[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Obtener una venta por ID
   */
  obtener(id: number): Observable<Venta> {
    return this.http
      .get<ApiResponse<Venta>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Crear una nueva venta (ADMIN o SELLER)
   */
  crear(payload: CreateVentaRequest): Observable<Venta> {
    return this.http
      .post<ApiResponse<Venta>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }
}
