import { Injectable, Inject, PLATFORM_ID, Optional, REQUEST, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as cookie from 'cookie';
import { SSR_COOKIES } from '../../interceptors/token.interceptor';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private tokenKey = 'access_token';
    private isBrowser: boolean;
    private isServer: boolean;

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object,
        public jwtHelperService: JwtHelperService,
        @Optional() @Inject(REQUEST) private request: Request
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.isServer = isPlatformServer(platformId);
    }

    getToken(): string | null {
        // if (this.isBrowser) {
        //     return localStorage.getItem(this.tokenKey);
        // }

        // if (this.isServer && this.request?.headers) {
        //     const cookieHeader = inject(SSR_COOKIES, { optional: true });
        //     console.log('SSR_COOKIES:', cookieHeader);


        //     const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
        //     return cookies[this.tokenKey] || null;
        // }

        return null;
    }

    setToken(token: string): void {
        // SSR no puede escribir cookies desde el frontend. Laravel debe hacer esto.
        // localStorage.setItem(this.tokenKey, token);
        // Si se desea, se puede implementar un observable para manejar el estado de autenticación
    }

    savePayload(payload: any): void {
        if (this.isBrowser) {
            localStorage.setItem(this.tokenKey, payload.access_token);
        } else if (this.isServer && this.request?.headers) {
            const cookieHeader = inject(SSR_COOKIES, { optional: true });
            if (cookieHeader) {
                const cookies = cookie.parse(cookieHeader);
                cookies[this.tokenKey] = payload.access_token;
                // Aquí se debería enviar las cookies actualizadas al cliente
                // Esto depende de cómo se maneje la respuesta en el servidor
            }
        }
    }

    removeToken(): void {
        if (this.isBrowser) {
            localStorage.removeItem(this.tokenKey);
        }
    }

    logout(): void {
        this.removeToken();
        if (this.isBrowser) this.router.navigate(['/login']);
    }

    isValid(): boolean {
        const token = this.getToken();
        console.log('Token:', token);

        return token ? !this.jwtHelperService.isTokenExpired(token) : false;
    }

    getPayload(): any | null {
        const token = this.getToken();
        return token ? this.jwtHelperService.decodeToken(token) : null;
    }
}
