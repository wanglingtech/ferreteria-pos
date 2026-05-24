import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';
import { HttpErrorService } from '../services/http-error.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const errorService = inject(HttpErrorService);
  const router = inject(Router);

  const isLoginRequest = req.url.includes('/auth/login');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        errorService.notify('Ocurrió un error inesperado en la aplicación.');
        return throwError(() => error);
      }

      if (error.status === 401 || error.status === 403) {
        if (isLoginRequest) {
          errorService.notify(error.error?.message || 'Credenciales inválidas.');
          return throwError(() => error);
        }

        authSession.clearSession();
        errorService.notify('Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente.');

        if (!router.url.startsWith('/auth/login')) {
          void router.navigate(['/auth/login'], {
            queryParams: { reason: 'session-expired' },
            replaceUrl: true,
          });
        }

        return throwError(() => error);
      }

      const message =
        error.error?.message ||
        mapStatusToMessage(error.status) ||
        'No se pudo completar la solicitud.';

      errorService.notify(message);
      return throwError(() => error);
    }),
  );
};

function mapStatusToMessage(status: number): string | null {
  const map: Record<number, string> = {
    0: 'No se pudo conectar con el servidor.',
    400: 'Solicitud inválida. Verifica los datos ingresados.',
    404: 'Recurso no encontrado.',
    409: 'Conflicto de datos.',
    422: 'No se pudo procesar la solicitud.',
    500: 'El servidor encontró un error inesperado.',
  };

  return map[status] || null;
}
