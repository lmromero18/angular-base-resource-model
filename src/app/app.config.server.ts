import {
  mergeApplicationConfig,
  ApplicationConfig,
  APP_INITIALIZER,
  inject,
  makeStateKey,
  TransferState,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// Clave donde guardaremos la JWK para que el cliente la lea SIN hacer GET
const JWK_STATE = makeStateKey<JsonWebKey | null>('SERVER_PUBLIC_JWK');

// Ajusta esta URL si tu API está en otro host/puerto o sin prefijo 'api'
const JWK_URL = 'http://127.0.0.1:5000/api/crypto/public-key';

function serverJwkInitializer() {
  const http = inject(HttpClient);
  const ts = inject(TransferState);
  return async () => {
    try {
      const jwk = await firstValueFrom(http.get<JsonWebKey>(JWK_URL));
      ts.set(JWK_STATE, jwk as any);
    } catch {
      // Si falla, no rompemos el render: dejamos null y el cliente NO hará fallback
      ts.set(JWK_STATE, null as any);
    }
  };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // HttpClient para poder hacer el GET de la JWK desde el servidor
    provideHttpClient(withFetch()),
    // Precarga la JWK en SSR y la pasa por TransferState
    { provide: APP_INITIALIZER, useFactory: serverJwkInitializer, multi: true },
  ],
};

// Exporta el config combinado tal como ya lo estabas haciendo
export const config = mergeApplicationConfig(appConfig, serverConfig);
