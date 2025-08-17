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

  // Mapa para manejar tipos de URL
  private urlTypes: { [key: string]: string } = {
    default: environment.apiUrl, // URL por defecto
    custom: '',
  };

  private _currentUrlType: string = 'default'; // URL que se usará por defecto

  // Método para establecer un custom URL
  public setCustomUrl(url: string): void {
    this.urlTypes['custom'] = url;
  }

  // Establece el tipo de URL a usar
  public setUrlType(urlType: 'default' | 'custom'): void {
    this._currentUrlType = urlType;
  }

  // Método para obtener la URL correcta según el tipo
  private getBaseUrl(): string {
    return this.urlTypes[this._currentUrlType] || environment.apiUrl;
  }

  private buildHeaders(): { headers?: HttpHeaders; withCredentials?: boolean } {
    // if (this.executionMode === 'server')
    return { withCredentials: true };
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    });
    return { headers };
  }

  getAll(
    endpoint: string,
    params: HttpParams | any = {},
  ): Observable<IPaginatedResponse<T>> {
    const key = makeStateKey<T[]>(`${endpoint}-getAll`);

    return this.http
      .get<IPaginatedResponse<T>>(`${this.getBaseUrl()}/${endpoint}`, {
        ...this.buildHeaders(),
        params,
      })
      .pipe(
        tap((response) => {
          if (this.executionMode === 'server') {
            this.transferState.set(key, response.data);
          }
        }),
      );
  }

  show<R = T>(endpoint: string, id: string | number): Observable<R> {
    const key = makeStateKey<R>(`${endpoint}-${id}-show`);
    if (this.executionMode === 'server' && this.transferState.hasKey(key)) {
      const data = this.transferState.get<R>(key, null as any);
      this.transferState.remove(key);
      return of(data);
    }

    return this.http
      .get<R>(`${this.getBaseUrl()}/${endpoint}/${id}`, this.buildHeaders())
      .pipe(
        tap((data) => {
          if (this.executionMode === 'server') {
            this.transferState.set(key, data);
          }
        }),
      );
  }

  delete(endpoint: string, id: string | number): Observable<any> {
    return this.http.delete(
      `${this.getBaseUrl()}/${endpoint}/${id}`,
      this.buildHeaders(),
    );
  }

  post<R = T>(endpoint: string, payload: any): Observable<R> {
    return this.http.post<R>(
      `${this.getBaseUrl()}/${endpoint}`,
      payload,
      this.buildHeaders(),
    );
  }

  patch<R = T>(
    endpoint: string,
    id: string | number,
    payload: any,
  ): Observable<R> {
    return this.http.patch<R>(
      `${this.getBaseUrl()}/${endpoint}/${id}`,
      payload,
      this.buildHeaders(),
    );
  }

  public setExecutionMode(mode: 'server' | 'client') {
    this.executionMode = mode;
  }
}
