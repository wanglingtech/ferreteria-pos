import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import {
  ResumenInventario,
  ProductoCritico,
} from '../interfaces/inventario.interface';

@Injectable({ providedIn: 'root' })
export class InventarioApiService {
  private baseUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<ResumenInventario> {
    return this.http
      .get<ApiResponse<ResumenInventario>>(`${this.baseUrl}/resumen`)
      .pipe(map((res) => res.data));
  }

  obtenerProductosCriticos(search: string = ''): Observable<ProductoCritico[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http
      .get<
        ApiResponse<ProductoCritico[]>
      >(`${this.baseUrl}/productos-criticos`, { params })
      .pipe(map((res) => res.data));
  }
}
