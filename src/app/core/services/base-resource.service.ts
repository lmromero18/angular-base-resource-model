import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, makeStateKey, TransferState } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attribute } from '../models/attribute.model';
import { FormField } from '../models/field-types';
import { PaginatedResponse } from '../models/paginated-response.model';
import { AuthService } from './auth/auth.service';
import { ModelSelectOption } from '../models/select-option.model';

@Injectable({ providedIn: 'root' })
export abstract class BaseResourceService {
    abstract name: string;
    abstract endpoint: string;
    abstract primaryKey: string;
    abstract attributes: Attribute[];

    protected authService = inject(AuthService);
    protected fb = new FormBuilder();
    protected _form!: FormGroup;
    private _customEndpoint?: string;
    private executionMode: 'server' | 'client' = 'server';
    public params: HttpParams = new HttpParams();
    public items: any[] = [];
    public pagination = {
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
        from: 1,
        to: 0
    };

    constructor(protected http: HttpClient, protected transferState: TransferState) { }

    private buildHeaders(): { headers?: HttpHeaders; withCredentials?: boolean } {
        if (this.executionMode === 'server') return { withCredentials: true };

        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });

        return { headers };
    }

    get form(): FormGroup {
        return this._form;
    }

    setParams(params: HttpParams): this {
        this.params = params;
        return this;
    }

    getParams(): HttpParams {
        return this.params ?? new HttpParams();
    }

    getExecutionMode(): 'server' | 'client' {
        return this.executionMode;
    }

    side(mode: 'server' | 'client'): this {
        const clone = this.new();
        clone.executionMode = mode;
        return clone;
    }

    initForm(initialData: any = {}) {
        this._form = this.buildForm(initialData);
    }

    buildForm(initialData: any = {}): FormGroup {
        const group: { [key: string]: any } = {};
        for (const attr of this.getFormAttributes()) {
            const validators = [];
            if (attr.input?.required) validators.push(Validators.required);
            group[attr.name] = [initialData[attr.name] ?? '', validators];
        }
        return this.fb.group(group);
    }

    getAttribute(name: string): Attribute | undefined {
        return this.attributes.find((a) => a.name === name);
    }

    getAttributes(): Attribute[] {
        return this.attributes;
    }

    getFormAttributes(): Attribute[] {
        return this.attributes.filter((a) => a.input);
    }

    getListableAttributes(): Attribute[] {
        return this.attributes.filter((a) => a.table?.listable);
    }

    getPrimaryKey(): string {
        return this.primaryKey;
    }

    getEndpoint(): string {
        return this.endpoint;
    }

    getUrl(): string {
        return `${environment.apiUrl}/${this._customEndpoint || this.endpoint}`;
    }

    getAll<T>(onSuccess?: (data: T[]) => void, onError?: (error: any) => void): void {
        const key = makeStateKey<T[]>(`${this.endpoint}-getAll`);

        if (this.transferState.hasKey(key)) {
            const data = this.transferState.get<T[]>(key, []);
            console.log(`Using cached data for ${this.endpoint}`);

            console.log('Cached data:', data);


            this.transferState.remove(key);

            this.items = data;
            this.pagination = {
                currentPage: 1,
                lastPage: 1,
                perPage: data.length,
                total: data.length,
                from: 1,
                to: data.length,
            };

            if (onSuccess) onSuccess(data);
            return;
        }

        this.http.get<PaginatedResponse<T>>(this.getUrl(), {
            ...this.buildHeaders(),
            params: this.getParams()
        }).subscribe({
            next: (response) => {
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
                }

                if (onSuccess) onSuccess(response.data);
            },
            error: (err) => {
                if (onError) onError(err);
            }
        });
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

    post<T>(): Observable<T> {
        return this.http.post<T>(this.getUrl(), this.getValues(), this.buildHeaders());
    }

    public from(endpoint: string): this {
        this.endpoint = endpoint;
        return this;
    }

    getValues(): any {

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

    public where(
        column: string,
        operator: '=' | 'not' | 'between' | 'gte' | 'lte' | 'like',
        value: string
    ): this {
        const finalOperator = !operator || operator === '=' ? '' : `_${operator}`;
        this.params = this.params.set(`${column}${finalOperator}`, value);
        return this;
    }

    public new(): this {
        const clone = Object.create(this);
        return clone;
    }

    public paginate(perPage: number, page: number = 1): this {
        this.params = this.params?.set("per_page", perPage?.toString());
        this.params = this.params?.set("page", page?.toString());

        return this;
    }

    public setPage(perPage: number = 1) {
        this.params = this.params?.set("page", perPage?.toString());

        return this;
    }

    public getPage(): number {
        return parseInt(this.params?.get("page") || "");
    }

    public setPerPage(page: number) {
        this.params = this.params?.set("per_page", page.toString());

        return this;
    }

    public getPerPage(): number {
        return parseInt(this.params?.get("per_page") || "");
    }

    public relations(relations: string[]): this {

        if (!relations || relations.length === 0) {
            this.params = this.params?.delete("with");
            return this;
        }

        this.params = this.params?.set("with", relations.join(","));

        return this;
    }

    public setSelectSource(
        label: ((item: any) => string) | string,
        value: ((item: any) => any) | string,
        source: ((model: BaseResourceService) => void) | any[],
        filter?: CallableFunction
    ): ModelSelectOption {
        let model: any;

        if (typeof source === "function") {
            model = this.new();
            source(model);
            model.getAll();
        } else {
            model = this.new();
            model.items = source;
        }

        return new ModelSelectOption(label, value, model, this, filter);
    }


    public getFormInputs(): FormField[] {
        return this.getFormAttributes()
            .map((item: any) => item.input);
    }

    public getSelectOptions(input: FormField): { label: string; value: any }[] {
        const options = input.options;

        if (!options) return [];

        if (typeof options === 'function') {
            const result = options(this);

            if (result instanceof ModelSelectOption) {
                return result.getOptionsAsArray();
            }

            return result;
        }

        if (options instanceof ModelSelectOption) {
            return options.getOptionsAsArray();
        }

        return options;
    }


}
