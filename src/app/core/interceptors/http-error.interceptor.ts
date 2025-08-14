// http-error.interceptor.ts
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { /* ... */ } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { catchError, throwError } from 'rxjs';

export interface ErrorState {
  status: number;
  message: string;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isPlatformServer(platformId)) {
        const key = makeStateKey<ErrorState>('error-' + req.url); 
        
        transferState.set(key, { status: error.status, message: error.message });
        console.error(`SSR Error for ${req.urlWithParams}:`, error.message);
      }
      return throwError(() => error);
    })
  );
};