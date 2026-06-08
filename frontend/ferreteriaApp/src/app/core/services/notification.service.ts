import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notificaciones`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Polling cada 30 segundos
    interval(30000).subscribe(() => this.cargarNotificaciones());
  }

  cargarNotificaciones(): void {
    this.http
      .get<ApiResponse<Notification[]>>(this.baseUrl)
      .pipe(map((res) => res.data))
      .subscribe((data) => this.notificationsSubject.next(data));
  }

  marcarComoLeida(id: number): Observable<Notification> {
    return this.http
      .patch<ApiResponse<Notification>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(map((res) => res.data));
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http
      .patch<ApiResponse<any>>(`${this.baseUrl}/read-all`, {})
      .pipe(map((res) => res.data));
  }

  eliminarNotificacion(id: number): Observable<any> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  eliminarNotificaciones(ids: number[]): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/delete-many`, { ids })
      .pipe(map((res) => res.data));
  }

  eliminarTodas(): Observable<any> {
    return this.http
      .delete<ApiResponse<any>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  // Método para crear una notificación desde el frontend (usado en reportes)
  crearNotificacionFrontend(payload: any): Observable<Notification> {
    return this.http
      .post<ApiResponse<Notification>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }
}
