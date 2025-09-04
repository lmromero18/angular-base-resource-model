import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { routes } from './app.routes';
import { cryptoInterceptor } from './core/crypto/crypto.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { httpTransferStateInterceptor } from './core/interceptors/http-transfer-state.interceptor';
import { serverHttpInterceptor } from './core/interceptors/server.interceptor';
import { AuthExpiryService } from './core/services/auth/auth-expiry.service';

function authExpiryInitializer() {
  const svc = inject(AuthExpiryService);
  return () => {
    svc.start();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        httpTransferStateInterceptor,
        httpErrorInterceptor,
        serverHttpInterceptor,
        cryptoInterceptor,
      ]),
    ),
    { provide: JWT_OPTIONS, useValue: {} },
    JwtHelperService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: authExpiryInitializer,
    },
  ],
};
