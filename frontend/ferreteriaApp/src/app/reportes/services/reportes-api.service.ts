import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { ReporteGeneral, VentaPorDia } from '../interfaces/reportes.interface';
// Importamos la interfaz Venta desde la ruta de ventas (no la duplicamos)
import { Venta } from '../../ventas/interfaces/venta.interface';

@Injectable({ providedIn: 'root' })
export class ReportesApiService {
  private baseUrl = `${environment.apiUrl}/reportes`;
  constructor(private http: HttpClient) {}

  obtenerResumen(from?: string, to?: string): Observable<ReporteGeneral> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http
      .get<ApiResponse<ReporteGeneral>>(`${this.baseUrl}/resumen`, { params })
      .pipe(map((res) => res.data));
  }

  obtenerVentasPorDia(from?: string, to?: string): Observable<VentaPorDia[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http
      .get<
        ApiResponse<VentaPorDia[]>
      >(`${this.baseUrl}/ventas-por-dia`, { params })
      .pipe(map((res) => res.data));
  }

  // ✅ Nuevo método
  obtenerVentasPaginadas(
    from?: string,
    to?: string,
    search?: string,
    page = 1,
    pageSize = 10,
  ): Observable<{
    items: Venta[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (search) params = params.set('search', search);
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/ventas`, { params })
      .pipe(map((res) => res.data));
  }
}
