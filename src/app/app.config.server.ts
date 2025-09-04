// server.config.ts
import {
  ApplicationConfig,
  APP_INITIALIZER,
  inject,
  mergeApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, throwError, catchError } from 'rxjs';
import { TransferState, makeStateKey } from '@angular/core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { environment } from '../environments/environment';
import { SERVER_PUBLIC_JWK_KEY } from './core/core.states.key';

const JWK_STATE = makeStateKey<JsonWebKey | null>(SERVER_PUBLIC_JWK_KEY);
const url = environment.apiUrl;
const JWK_URL = `${url}/crypto/public-key`;

function serverJwkInitializer() {
  const http = inject(HttpClient);
  const ts = inject(TransferState);
  return async () => {
    try {
      const jwk = await firstValueFrom(
        http.get<JsonWebKey>(JWK_URL).pipe(
          timeout(3000),
          catchError((err) => throwError(() => err)),
        ),
      );
      console.log('jwk fetched from server:', jwk);

      if (!jwk) throw new Error('SSR: respuesta sin JWK');
      ts.set(JWK_STATE, jwk);
    } catch (e) {
      throw new Error('[SSR] No se pudo obtener la JWK (fail-fast)');
    }
  };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: APP_INITIALIZER, multi: true, useFactory: serverJwkInitializer },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
