import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error?.message ||
        error.statusText ||
        'Unexpected error occurred';

      if (error.status === 401 && isBrowser) {
        console.warn('🔒 Unauthorized - redirecting to /Ingresar');
        router.navigate(['/Ingresar']);
      } else if (isBrowser) {
        alert(`HTTP Error ${error.status}: ${message}`);
      }

      return throwError(() => error);
    })
  );
};
