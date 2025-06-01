import { isPlatformServer } from "@angular/common";
import { HttpInterceptorFn } from "@angular/common/http";
import { inject, InjectionToken, PLATFORM_ID } from "@angular/core";

export const SSR_COOKIES = new InjectionToken<string>('SSR_COOKIES');

export const universalInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    console.log('Universal Interceptor:', platformId);
    
    
  
    if (isPlatformServer(platformId)) {
      const cookieHeader = inject(SSR_COOKIES, { optional: true });
  
      if (cookieHeader) {
        const modifiedReq = req.clone({
          setHeaders: {
            cookie: cookieHeader,
          },
        });
  
        return next(modifiedReq);
      }
    }
  
    return next(req);
  };
  