import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { DashboardData } from '../interfaces/dashboard.interface';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http
      .get<ApiResponse<DashboardData>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }
}
