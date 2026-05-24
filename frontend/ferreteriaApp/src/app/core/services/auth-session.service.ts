import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AuthUser, LoginData } from '../../auth/interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenStorageKey = 'fj_access_token';
  private readonly userStorageKey = 'fj_user';

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    this.restoreUser(),
  );
  readonly currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return null;
    }

    return token;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  saveSession(loginData: LoginData): void {
    localStorage.setItem(this.tokenStorageKey, loginData.accessToken);
    localStorage.setItem(this.userStorageKey, JSON.stringify(loginData.user));
    this.currentUserSubject.next(loginData.user);
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    this.currentUserSubject.next(null);
  }

  logout(): void {
    this.clearSession();
  }

  private restoreUser(): AuthUser | null {
    const token = localStorage.getItem(this.tokenStorageKey);
    const userRaw = localStorage.getItem(this.userStorageKey);

    if (!token || !userRaw || this.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenStorageKey);
      localStorage.removeItem(this.userStorageKey);
      return null;
    }

    try {
      return JSON.parse(userRaw) as AuthUser;
    } catch {
      localStorage.removeItem(this.tokenStorageKey);
      localStorage.removeItem(this.userStorageKey);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    const exp = payload?.['exp'];

    if (typeof exp !== 'number') {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowInSeconds;
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
