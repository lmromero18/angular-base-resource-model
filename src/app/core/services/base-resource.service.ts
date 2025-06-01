import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Attribute } from "../models/attribute.model";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable, makeStateKey, TransferState } from "@angular/core";
import { map, Observable, of, tap } from "rxjs";
import { PaginatedResponse } from "../models/paginated-response.model";
import { AuthService } from "./auth/auth.service";

/**
 * Clase abstracta base para la gestión de recursos con formularios dinámicos y endpoints RESTful.
 * Se espera que las clases hijas definan `name`, `endpoint`, `primaryKey` y `attributes`.
 */
@Injectable({
    providedIn: "root",
})
export abstract class BaseResourceService {
    /** Nombre del recurso (solo informativo) */
    abstract name: string;

    /** Endpoint base del recurso (sin prefijo API) */
    abstract endpoint: string;

    /** Clave primaria del recurso */
    abstract primaryKey: string;

    /** Atributos que definen el modelo del recurso */
    abstract attributes: Attribute[];

    protected authService = inject(AuthService);

    protected fb = new FormBuilder();
    protected _form!: FormGroup;
    private _customEndpoint?: string;
    private executionMode: 'server' | 'client' = 'server';
    private params: { [key: string]: any } = {};
    public items: any[] = [];
    public pagination = {
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
        from: 1,
        to: 0
    };

    constructor(
        protected http: HttpClient,
        protected transferState: TransferState
    ) { }

    private buildHeaders(): { headers?: HttpHeaders; withCredentials?: boolean } {
        if (this.executionMode === 'server') {
            return { withCredentials: true };
        }

        const token = this.authService.getToken(); // o desde localStorage
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        });

        return { headers };
    }

    /** Retorna el formulario actual */
    get form(): FormGroup {
        return this._form;
    }

    /**
     * Clona el servicio actual cambiando el modo de ejecución ('server' o 'client').
     * Útil para precarga de datos en SSR.
     * @param mode Modo de ejecución
     */
    side(mode: 'server' | 'client'): this {
        const clone = Object.create(this);
        clone.executionMode = mode;
        this.params = {
            ...this.params,
            executionMode: mode,
        }
        return clone;
    }

    setParams(params: { [key: string]: any }): this {
        return {...this.params, ...params} as this;
    }

    getParams(): { [key: string]: any } {
        return this.params;
    }

    /**
     * Obtiene el modo de ejecución actual ('server' o '
     * client').
     * @returns Modo de ejecución
     * */

    getExecutionMode(): 'server' | 'client' {
        return this.executionMode;
    }

    /**
     * Inicializa el formulario con datos iniciales (puede estar vacío).
     * @param initialData Objeto con datos iniciales
     */
    initForm(initialData: any = {}) {
        this._form = this.buildForm(initialData);
    }

    /**
     * Construye dinámicamente un formulario basado en los atributos configurados.
     * @param initialData Datos para prellenar el formulario
     * @returns FormGroup
     */
    buildForm(initialData: any = {}): FormGroup {
        const group: { [key: string]: any } = {};
        for (const attr of this.getFormAttributes()) {
            const validators = [];
            if (attr.input?.required) validators.push(Validators.required);
            group[attr.name] = [initialData[attr.name] ?? '', validators];
        }
        return this.fb.group(group);
    }

    /**
     * Retorna un atributo por nombre, si existe.
     * @param name Nombre del atributo
     */
    getAttribute(name: string): Attribute | undefined {
        return this.attributes.find((a) => a.name === name);
    }

    /** Retorna todos los atributos del modelo */
    getAttributes(): Attribute[] {
        return this.attributes;
    }

    /** Retorna solo los atributos que deben estar presentes en el formulario */
    getFormAttributes(): Attribute[] {
        return this.attributes.filter((a) => a.input);
    }

    /** Retorna solo los atributos que deben mostrarse en la tabla (listado) */
    getListableAttributes(): Attribute[] {
        return this.attributes.filter((a) => a.table?.listable);
    }

    /** Retorna el nombre de la clave primaria */
    getPrimaryKey(): string {
        return this.primaryKey;
    }

    /** Retorna el endpoint base */
    getEndpoint(): string {
        return this.endpoint;
    }

    /** Retorna la URL absoluta a consumir vía HTTP */
    getUrl(): string {
        return `${environment.apiUrl}/${this._customEndpoint || this.endpoint}`;
    }

    /**
     * Obtiene todos los recursos desde el servidor (con soporte para TransferState en SSR).
     * @returns Observable con la colección de recursos
     */
    getAll<T>(): Observable<PaginatedResponse<T>> {
        const key = makeStateKey<T[]>(`${this.endpoint}-getAll`);
        console.log(`🔍 Ejecutando getAll para ${this.endpoint} en modo ${this.executionMode}`);

        // Usar TransferState si existe (cliente o servidor)
        if (this.transferState.hasKey(key)) {
            console.log(`🔍 Usando TransferState para ${this.endpoint}`);
            
            const data = this.transferState.get<T[]>(key, []);
            this.transferState.remove(key);

            const response: PaginatedResponse<T> = {
                current_page: 1,
                data,
                first_page_url: '',
                from: 1,
                last_page: 1,
                last_page_url: '',
                links: [],
                next_page_url: null,
                path: '',
                per_page: data.length,
                prev_page_url: null,
                to: data.length,
                total: data.length,
            };

            this.items = data;
            this.pagination = {
                currentPage: 1,
                lastPage: 1,
                perPage: data.length,
                total: data.length,
                from: 1,
                to: data.length,
            };

            console.log('✅ Usando datos cacheados desde TransferState');
            return of(response);
        }

        // Realiza petición HTTP y guarda en TransferState si es SSR
        return this.http.get<PaginatedResponse<T>>(this.getUrl(), {
            withCredentials: true,
        }).pipe(
            tap(response => {
                this.items = response.data;
                this.pagination = {
                    currentPage: response.current_page,
                    lastPage: response.last_page,
                    perPage: response.per_page,
                    total: response.total,
                    from: response.from,
                    to: response.to,
                };

                if (this.executionMode === 'server') {
                    this.transferState.set(key, response.data);
                    console.log('💾 Guardando datos en TransferState');
                }
            })
        );
    }

    show<T>(id: string | number): Observable<T> {
        const key = makeStateKey<T>(`${this.endpoint}-${id}-show`);

        if (this.executionMode === 'server' && this.transferState.hasKey(key)) {
            const data = this.transferState.get<T>(key, null as any);
            this.transferState.remove(key);
            return of(data);
        }

        return this.http.get<T>(`${this.getUrl()}/${id}`, this.buildHeaders()).pipe(
            tap(data => {
                if (this.executionMode === 'server') {
                    this.transferState.set(key, data);
                }
            })
        );
    }

    delete(id: string | number): Observable<any> {
        return this.http.delete(`${this.getUrl()}/${id}`, this.buildHeaders());
    }

    update<T>(id: string | number): Observable<T> {
        return this.http.put<T>(`${this.getUrl()}/${id}`, this.getValues(), this.buildHeaders());
    }

    create<T>(): Observable<T> {
        return this.http.post<T>(this.getUrl(), this.getValues(), this.buildHeaders());
    }

    /**
     * Cambia dinámicamente el endpoint para una operación puntual.
     * @param endpoint Subruta del endpoint alternativo
     * @returns Instancia clonada con endpoint actualizado
     */
    public from(endpoint: string): this {
        const clone = Object.create(this) as this;
        clone._customEndpoint = endpoint;
        return clone;
    }

    /**
     * Retorna los valores actuales del formulario, procesando setters definidos en `attributes`.
     * @returns Objeto plano con los valores del formulario
     */
    getValues(): any {
        if (!this._form) {
            throw new Error('Form was not initialized. Call initForm() first.');
        }

        const values: any = {};

        for (const attr of this.getFormAttributes()) {
            let value = this._form.get(attr.name)?.value;

            if (attr.input?.setter) {
                value = attr.input.setter(value);
            }

            values[attr.name] = value;
        }

        return values;
    }

}
