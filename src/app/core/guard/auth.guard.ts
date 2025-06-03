import { inject } from '@angular/core';
import { CanActivateFn, UrlTree, Router } from '@angular/router';
import { REQUEST, PLATFORM_ID } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Request } from 'express';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const request = inject(REQUEST, { optional: true });
  const platformId = inject(PLATFORM_ID);

  const isBrowser = isPlatformBrowser(platformId);
  let token: any = null;
  let accessToken: string | undefined = undefined;

  if (isBrowser) {
    token = sessionStorage.getItem('access_token');
  } else if (request?.headers?.get('cookie')) {
    // Dividir las cookies y crear un objeto clave:valor
    const cookies: any = request?.headers?.get('cookie')!
      .split(';')
      .map(c => c.trim());

    token = cookies || null;

    const accessTokenEntry = token?.find((c: any) => c.startsWith('access_token='));
    console.log(accessTokenEntry);
    
    accessToken = accessTokenEntry?.split('=')[1] || null;
    console.log('accessToken:', accessToken);
    
  }


  // let response = accessToken && authService.isValid(accessToken);
  // console.log(response);
  




  // const isValid = !!(token && !jwtHelper.isTokenExpired(token));
  // return response ? true : inject(Router).createUrlTree(['/Ingresar']);
  return true;
};
