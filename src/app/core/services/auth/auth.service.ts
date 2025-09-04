import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Inject,
  Injectable,
  Optional,
  PLATFORM_ID,
  REQUEST,
} from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ACCESS_TOKEN_NAME, DEFAULT_LOGIN_ROUTE } from '../../core.constants';
import { redirectTo } from '../../../utils/route-utils';
import { HttpResourceService } from '../base/http-resource.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public secret: any;
  public refreshToken: any;
  private isBrowser: boolean;

  public isLoading = false;

  constructor(
    public router: Router,
    @Inject(HttpResourceService)
    private httpResourceService: HttpResourceService,
    @Inject(JwtHelperService) public jwtHelperService: JwtHelperService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject(REQUEST) private request: Request,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  public logout(routeToDirect: string = DEFAULT_LOGIN_ROUTE): void {
    // Use HttpResourceService with a custom base URL for the auth domain
    const base = environment.urlAuth;
    this.httpResourceService.setCustomUrl(base);
    this.httpResourceService.setUrlType('custom');

    this.httpResourceService.post('logout', {}).subscribe({
      next: () => {
        this.httpResourceService.setUrlType('default');
        redirectTo(routeToDirect);
      },
      error: (err) => {
        this.httpResourceService.setUrlType('default');
        redirectTo(routeToDirect);
      },
    });
  }

  public refresh(): void {
    // Use HttpResourceService with a custom base URL for the auth domain
    const base = environment.urlAuth;
    this.httpResourceService.setCustomUrl(base);
    this.httpResourceService.setUrlType('custom');

    this.httpResourceService
      .post('refresh', {})
      .pipe(finalize(() => this.httpResourceService.setUrlType('default')))
      .subscribe({
        next: () => {},
        error: (err) => {
          console.log('Error refreshing token');
        },
      });
  }

  public getToken(): string | null {
    const cookieHeader: string | undefined =
      ((this.request as any)?.headers?.get?.('cookie') as string | undefined) ||
      ((this.request as any)?.headers?.cookie as string | undefined);

    if (cookieHeader) {
      return this.readCookieFromString(cookieHeader, ACCESS_TOKEN_NAME);
    }

    return null;
  }

  public getUser(): any {
    try {
      const token = this.getToken();
      const payload: any = token
        ? this.jwtHelperService.decodeToken(token)
        : undefined;

      return payload?.usr ?? undefined;
    } catch {
      return undefined;
    }
  }

  public getSub(): string | null {
    const tok = this.getToken();
    if (!tok) return null;
    const payload: any = this.jwtHelperService.decodeToken(tok);
    return payload?.sub ?? null;
  }

  public getClient(): any {
    const tok = this.getToken();
    if (tok) {
      const { aud } = this.jwtHelperService.decodeToken(tok);
      return aud;
    }
    return null;
  }

  public getPermissions(): string[] {
    const tok = this.getToken();
    if (!tok) return [];
    try {
      const payload: any = this.jwtHelperService.decodeToken(tok);
      return Array.isArray(payload?.scp) ? payload.scp : [];
    } catch {
      return [];
    }
  }

  //TODO: REFACTOR
  // public getPermissionsByModule(module: string | string[]): string[] {
  //   const scopes = this.getPermissions();
  //   if (Array.isArray(module)) {
  //     return scopes.filter((s) => module.some((m) => s.startsWith(m + ':')));
  //   }
  //   return scopes.filter((s) => s.startsWith(module + ':'));
  // }

  //TODO: IMPLEMENT
  public isSuperUser(): boolean {
    return false;
  }

  public hasPermission(permission: string | string[]): boolean {
    const permissions = this.getPermissions();
    if (!permission || !this.getToken()) return true;
    if (Array.isArray(permission)) {
      if (permission.length === 0) return true;
      return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  }

  private readCookieFromString(
    cookieString: string,
    name: string,
  ): string | null {
    if (!cookieString) return null;
    const parts = cookieString.split(';').map((c) => c.trim());
    const target = parts.find((c) => c.startsWith(name + '='));
    return target ? decodeURIComponent(target.split('=')[1]) : null;
  }
}
