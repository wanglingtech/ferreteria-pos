import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { LoginData, LoginRequest } from '../interfaces/auth.interface';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly authBaseUrl = `${environment.apiUrl}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly authSession: AuthSessionService,
  ) {}

  login(payload: LoginRequest): Observable<LoginData> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.authBaseUrl}/login`, payload)
      .pipe(
        map((response) => response.data),
        tap((data) => this.authSession.saveSession(data)),
      );
  }
}
