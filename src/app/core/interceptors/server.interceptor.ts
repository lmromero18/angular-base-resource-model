import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '@angular/core';
import { environment } from '../../../environments/environment';

export const serverHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const request = inject(REQUEST, { optional: true });
  if (request) {
    if (req.url.startsWith(environment.apiUrl)) {
      const cookies = request.headers?.get('cookie');
      if (cookies) {
        const clonedReq = req.clone({
          setHeaders: {
            Cookie: cookies
          },
          withCredentials: true
        });
        return next(clonedReq);
      }
    }
  }
  return next(req);
};