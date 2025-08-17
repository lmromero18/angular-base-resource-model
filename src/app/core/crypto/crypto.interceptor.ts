import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { from, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import {
  HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse
} from '@angular/common/http';
import { AppCryptoService } from './app-crypto.service';

const METHODS = new Set(['POST', 'PUT', 'PATCH']);

export const cryptoInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const cryptoSvc = inject(AppCryptoService);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return next(req);
  }

  // Rehidrata (y si importó clave, devuelve promesa)
  const maybePromise = cryptoSvc.ensureReadyFromTransferStateOnce();

  // Espera a que termine cualquier importación pendiente
  const ready$ = from(
    (async () => {
      if (maybePromise) await maybePromise;
      await cryptoSvc.waitUntilReady();
      return;
    })()
  );

  const isFormData = (b: any) => typeof FormData !== 'undefined' && b instanceof FormData;

  const handleResponse = (event: any) => {
    if (event instanceof HttpResponse && cryptoSvc.looksEnvelope(event.body)) {
      return from(cryptoSvc.decryptEnvelope(event.body)).pipe(
        map(plain => event.clone({ body: plain }))
      );
    }
    return of(event);
  };

  const handleError = (err: any) => {
    if (err instanceof HttpErrorResponse && err.error && cryptoSvc.looksEnvelope(err.error)) {
      return from(cryptoSvc.decryptEnvelope(err.error)).pipe(
        mergeMap(plain =>
          throwError(() => new HttpErrorResponse({ ...err, error: plain, url: err.url ?? undefined }))
        ),
        catchError(() => throwError(() => err))
      );
    }
    return throwError(() => err);
  };

  return ready$.pipe(
    mergeMap(() => {
      const shouldEncrypt =
        cryptoSvc.isReady &&
        METHODS.has(req.method as any) &&
        !isFormData(req.body);

      if (!shouldEncrypt) {
        return next(req).pipe(mergeMap(handleResponse), catchError(handleError));
      }

      return from(cryptoSvc.encryptPayload(req.body)).pipe(
        mergeMap(({ envelope, nonce }) => {
          const encReq = req.clone({
            setHeaders: {
              'X-Enc': '1',
              'X-Nonce': nonce,
              'Content-Type': 'application/json',
            },
            body: envelope,
          });
          return next(encReq).pipe(mergeMap(handleResponse), catchError(handleError));
        })
      );
    })
  );
};
