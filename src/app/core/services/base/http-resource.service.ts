import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { TransferState, makeStateKey } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { IPaginatedResponse } from '../../models/paginated-response.model';

@Injectable({ providedIn: 'root' })
export class HttpResourceService<T = any> {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private transferState = inject(TransferState);
    private executionMode: 'server' | 'client' = 'server';

    private buildHeaders(): { headers?: HttpHeaders; withCredentials?: boolean } {
        if (this.executionMode === 'server') return { withCredentials: true };
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
        });
        return { headers };
    }

    getAll(endpoint: string, params: HttpParams | any = {}): Observable<IPaginatedResponse<T>> {
        const key = makeStateKey<T[]>(`${endpoint}-getAll`);

        // if (this.executionMode === 'server' && this.transferState.hasKey(key)) {
        //     const data = this.transferState.get<T[]>(key, []);
        //     this.transferState.remove(key);
        //     return of({
        //         current_page: 1,
        //         data,
        //         from: 1,
        //         last_page: 1,
        //         per_page: data.length,
        //         to: data.length,
        //         total: data.length,
        //         first_page_url: '',
        //         last_page_url: '',
        //         next_page_url: null,
        //         prev_page_url: null,
        //         path: '',
        //         links: []
        //     });
        // }

        return this.http.get<IPaginatedResponse<T>>(`${environment.apiUrl}/${endpoint}`, {
            ...this.buildHeaders(),
            params,
        }).pipe(
            tap(response => {
                if (this.executionMode === 'server') {
                    this.transferState.set(key, response.data);
                }
            })
        );
    }

    show<R = T>(endpoint: string, id: string | number): Observable<R> {
        const key = makeStateKey<R>(`${endpoint}-${id}-show`);
        if (this.executionMode === 'server' && this.transferState.hasKey(key)) {
            const data = this.transferState.get<R>(key, null as any);
            this.transferState.remove(key);
            return of(data);
        }

        return this.http.get<R>(`${environment.apiUrl}/${endpoint}/${id}`, this.buildHeaders()).pipe(
            tap(data => {
                if (this.executionMode === 'server') {
                    this.transferState.set(key, data);
                }
            })
        );
    }

    delete(endpoint: string, id: string | number): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/${endpoint}/${id}`, this.buildHeaders());
    }

    post<R = T>(endpoint: string, payload: any): Observable<R> {
        return this.http.post<R>(`${environment.apiUrl}/${endpoint}`, payload, this.buildHeaders());
    }

    put<R = T>(endpoint: string, id: string | number, payload: any): Observable<R> {
        return this.http.put<R>(`${environment.apiUrl}/${endpoint}/${id}`, payload, this.buildHeaders());
    }

    public setExecutionMode(mode: 'server' | 'client') {
        this.executionMode = mode;
    }
}
