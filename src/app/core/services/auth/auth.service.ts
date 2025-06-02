import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import * as CryptoJS from 'crypto-js';
import { NavigationExtras, Router } from '@angular/router';
import { Inject, Injectable, PLATFORM_ID, inject, Optional, REQUEST, RESPONSE_INIT } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Request, Response } from 'express';

@Injectable({ providedIn: 'root' })
export class AuthService {
    public user: any;
    public rols: any;
    public token: any;
    public secret: any;
    public refreshToken: any;
    private isBrowser: boolean;

    private readonly SECRET_NAME = 'uuid';
    private readonly ROLS_TOKEN_NAME = 'roles';
    private readonly ACCESS_TOKEN_NAME = 'access_token';
    private readonly REFRESH_TOKEN_NAME = 'refresh_token';

    constructor(
        public router: Router,
        private http: HttpClient,
        @Inject(JwtHelperService) public jwtHelperService: JwtHelperService,
        @Inject(PLATFORM_ID) private platformId: Object,
        @Optional() @Inject(REQUEST) private request: Request,
        @Optional() @Inject(RESPONSE_INIT) private response: Response
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
        this.token = this.getKey();
        this.user = this.getUser();
        this.secret = this.getToken();
    }

    private getStorageItem(key: string): string | null {
        if (this.isBrowser) {
            return sessionStorage.getItem(key);
        } else if (this.request && this.request.headers) {
            if (this.request.headers.cookie) {
                const cookies = this.request.headers.cookie.split(';').map(cookie => cookie.trim());
                const found = cookies.find(cookie => cookie.startsWith(`${key}=`));
                return found ? decodeURIComponent(found.substring(key.length + 1)) : null;
            }
        }
        return null;
    }

    private setStorageItem(key: string, value: string): void {
        if (this.isBrowser) {
            sessionStorage.setItem(key, value);
        } else if (this.response) {
            this.response.cookie(key, value, { httpOnly: false });
        }
    }

    private clearStorage(): void {
        if (this.isBrowser) {
            sessionStorage.clear();
        } else if (this.response && this.request?.cookies) {
            for (const key of Object.keys(this.request.cookies)) {
                this.response.clearCookie(key);
            }
        }
    }

    public savePayload(payload: any): void {
        if (!this.isBrowser && !this.response) return;

        this.rols = payload[this.ROLS_TOKEN_NAME];
        this.token = payload[this.ACCESS_TOKEN_NAME];
        this.secret = uuid();
        this.refreshToken = payload[this.REFRESH_TOKEN_NAME];

        this.setStorageItem(this.ROLS_TOKEN_NAME, this.encrypt(this.rols));
        this.setStorageItem(this.ACCESS_TOKEN_NAME, this.encrypt(this.token));
        this.setStorageItem(this.REFRESH_TOKEN_NAME, this.encrypt(this.refreshToken));
        this.setStorageItem(this.SECRET_NAME, this.secret);

        this.getUser();
    }

    public clearPayload(): void {
        this.clearStorage();
    }

    public logout(urlAuth?: string, routeDefault: string = '/Ingresar'): Observable<void> {
        return new Observable<void>((observer) => {
            const token = this.getToken();
            if (token) {
                this.http.get(`${urlAuth ?? environment.urlAuth}/api/v3/auth/logout`).subscribe(
                    () => {
                        this.clearPayload();
                        this.router.navigate([routeDefault]);
                        observer.next();
                        observer.complete();
                    },
                    (err) => {
                        console.log('Logout error:', err.error?.message || err.message);
                        this.clearPayload();
                        this.router.navigate([routeDefault]);
                        observer.error(err);
                    }
                );
            } else {
                observer.complete();
            }
        });
    }

    public isValid(): boolean {
        const token = this.getToken();
        return token ? !this.jwtHelperService.isTokenExpired(token) : false;
    }

    public getToken(): string {
        const encrypted = this.getStorageItem(this.ACCESS_TOKEN_NAME);
        return encrypted ? this.decrypt(encrypted) : '';
    }

    public getRefreshToken(): string {
        const encrypted = this.getStorageItem(this.REFRESH_TOKEN_NAME);
        return encrypted ? this.decrypt(encrypted) : '';
    }

    public getKey(): string | null {
        return this.getStorageItem(this.SECRET_NAME);
    }

    public getUser(): any {
        this.user = this.jwtHelperService.decodeToken(this.getToken());
        return this.user?.user;
    }

    public getSub(): string | null {
        const token = this.jwtHelperService.decodeToken(this.getToken());
        return token?.sub || null;
    }

    public getRols(): any[] {
        try {
            const encrypted = this.getStorageItem(this.ROLS_TOKEN_NAME);
            const decrypted = encrypted ? this.decrypt(encrypted) : '';
            this.rols = JSON.parse(atob(decrypted));
        } catch {
            this.rols = [];
        }
        return this.rols;
    }

    public getClient(): any {
        if (this.getToken()) {
            const { aud, adc } = this.jwtHelperService.decodeToken(this.getToken());
            return { co_cliente: aud, nb_cliente: adc };
        }
        return null;
    }

    public encrypt(value: string): string {
        return CryptoJS.AES.encrypt(value, this.getKey() ?? '').toString();
    }

    public decrypt(encrypted: string): string {
        const bytes = CryptoJS.AES.decrypt(encrypted, this.getKey() ?? '');
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    public authRedirect(url?: any[], extras?: NavigationExtras): Promise<boolean> {
        return this.getUser() && this.router.navigate(url || ['/'], extras);
    }

    public hasPermissions(permissionsArr: string[]): boolean {
        return _.some(this.getRols(), (r) =>
            r.all_permissions || _.some(r.permissions, (p: any) => permissionsArr.includes(p.cod_permission))
        );
    }

    public getPermissions(): string[] {
        return _(this.getRols())
            .map((r) => _(r?.permissions).map('cod_permission').value())
            .flattenDeep()
            .value();
    }

    public getPermissionsByModule(module: string | string[]): string[] {
        return _(this.getRols())
            .map((r) =>
                _(r?.permissions)
                    .filter((p: any) => p?.module === module || (Array.isArray(module) && module.includes(p?.module)))
                    .map('cod_permission')
                    .value()
            )
            .flattenDeep()
            .value();
    }

    public isSuperUser(): boolean {
        return _(this.getRols()).some((r) => r.all_permissions);
    }

    public isPermissionAssigned(permission: string): boolean {
        const permissions = this.getPermissions();
        return (
            !permission || (!!this.getToken() && (permissions.includes(permission) || this.isSuperUser()))
        );
    }

    public getTokenSection(accessToken: string, pos: number): any {
        if (accessToken) {
            return JSON.parse(atob(accessToken.split('.')[pos]));
        }
        return null;
    }
}
