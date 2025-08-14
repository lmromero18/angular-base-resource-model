import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { serverHttpInterceptor } from './core/interceptors/server.interceptor';
import { httpTransferStateInterceptor } from './core/interceptors/http-transfer-state.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        httpTransferStateInterceptor,
        httpErrorInterceptor,
        serverHttpInterceptor
      ])

    ),
    { provide: JWT_OPTIONS, useValue: {} },
    JwtHelperService
  ]
};
