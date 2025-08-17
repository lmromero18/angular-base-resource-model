import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { from, of } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { AppCryptoService } from '../crypto/app-crypto.service';
import { getPathname, isEncryptedResponse } from '../crypto/crypto-utils';

const METHODS = ['POST', 'PUT', 'PATCH'] as const;

function shouldEncrypt(
  req: HttpRequest<any>,
  encryptionReady: boolean,
): boolean {
  if (!encryptionReady) return false; // si no hay JWK (no SSR), no cifrar
  if (!METHODS.includes(req.method as any)) return false;
  if (typeof FormData !== 'undefined' && req.body instanceof FormData)
    return false;
  const path = getPathname(req.url);
  if (path === '/api/crypto/public-key' || path === '/crypto/public-key')
    return false;
  return path.startsWith('/api/'); // ajusta si quieres
}

export const encryptionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
) => {
  const cryptoSvc = inject(AppCryptoService);
  const ready = cryptoSvc.isEncryptionReady();
  console.log('Encryption ready:', ready);
  console.log(!shouldEncrypt(req, ready));
  if (!shouldEncrypt(req, ready)) {
    return next(req);
  }

  const urlPath = getPathname(req.url);

  return from(cryptoSvc.encryptPayload(req.method, urlPath, req.body)).pipe(
    mergeMap(({ envelope, nonce }) => {
      const encReq = req.clone({
        body: envelope,
        setHeaders: {
          'X-Encrypted': '1',
          'X-Nonce': nonce,
          'Content-Type': 'application/json',
        },
      });

      return next(encReq).pipe(
        mergeMap((evt) => {
          if (
            evt instanceof HttpResponse &&
            evt.headers.get('X-Encrypted-Response') === '1'
          ) {
            const body = evt.body;
            if (!isEncryptedResponse(body))
              throw new Error('Bad encrypted response shape');
            return from(
              cryptoSvc.decryptResponse(body, req.method, urlPath),
            ).pipe(map((decrypted) => evt.clone({ body: decrypted })));
          }
          return of(evt);
        }),
        catchError((e: HttpErrorResponse) => {
          throw e;
        }),
      );
    }),
  );
};
