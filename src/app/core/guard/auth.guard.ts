import { isPlatformBrowser } from '@angular/common';
import {
  PLATFORM_ID,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { DEFAULT_LOGIN_ROUTE } from '../core.constants';
import {
  AUTH_EXPIRATION_TS_KEY,
  IS_AUTHENTICATED_KEY,
} from '../core.states.key';
import { AuthService } from '../services/auth/auth.service';

const IS_AUTHENTICATED_STATE_KEY = makeStateKey<boolean>(IS_AUTHENTICATED_KEY);

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);

  // On the server (SSR), rely on the cookie from the incoming request
  if (!isPlatformBrowser(platformId)) {
    const token = authService.getToken();
    const isAuthenticated = !!token;
    // Decode exp from JWT if available to share with client
    let exp: number | null = null;
    try {
      if (token) {
        const payload: any = authService.jwtHelperService.decodeToken(token);
        exp = typeof payload?.exp === 'number' ? payload.exp : null;
      }
    } catch {}
    transferState.set(IS_AUTHENTICATED_STATE_KEY, isAuthenticated);
    if (exp) {
      transferState.set(makeStateKey<number>(AUTH_EXPIRATION_TS_KEY), exp);
    }
    return isAuthenticated ? true : router.createUrlTree([DEFAULT_LOGIN_ROUTE]);
  }

  // In the browser, use the SSR-auth result carried via TransferState.
  if (transferState.hasKey(IS_AUTHENTICATED_STATE_KEY)) {
    const isAuthenticated = transferState.get(
      IS_AUTHENTICATED_STATE_KEY,
      false,
    );
    return isAuthenticated ? true : router.createUrlTree([DEFAULT_LOGIN_ROUTE]);
  }

  return router.createUrlTree([DEFAULT_LOGIN_ROUTE]);
};
