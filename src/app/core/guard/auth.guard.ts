import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, UrlTree, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { IS_AUTHENTICATED_KEY } from '../core.states.key';
import { DEFAULT_LOGIN_ROUTE } from '../core.constants';

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
    transferState.set(IS_AUTHENTICATED_STATE_KEY, isAuthenticated);
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
