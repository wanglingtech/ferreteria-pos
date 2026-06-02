import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { Categoria } from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class CategoriasApiService {
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  listarActivas(): Observable<Categoria[]> {
    return this.http
      .get<
        ApiResponse<Categoria[]>
      >(this.baseUrl, { params: { isActive: 'true' } })
      .pipe(map((res) => res.data));
  }
}
