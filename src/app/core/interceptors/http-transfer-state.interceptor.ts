// http-transfer-state.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { inject, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { throwError } from 'rxjs'; 
import { ErrorState } from './http-error.interceptor';

export const httpTransferStateInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);

  if (isPlatformBrowser(platformId)) {
    const key = makeStateKey<ErrorState>('error-' + req.url);

    if (transferState.hasKey(key)) {
      const errorData = transferState.get(key, null);
      transferState.remove(key);

      return throwError(() => new HttpErrorResponse({
        status: errorData?.status,
        statusText: errorData?.message,
        url: req.url,
      }));
    }
  }

  return next(req);
};