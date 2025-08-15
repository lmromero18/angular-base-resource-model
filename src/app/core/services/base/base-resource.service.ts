import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Attribute } from '../../models/attribute.model';
import { FormField } from '../../models/form-field.model';
import { FormBuilderService } from './form-builder.service';
import { HttpResourceService } from './http-resource.service';
import { ModelSelectOption } from '../../models/select-option.model';
import { IPagination } from '../../models/paginated-response.model';
import { finalize, Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

/**
 * Clase base abstracta para gestionar recursos con formularios, peticiones HTTP y atributos declarativos.
 * Puede ser extendida por cualquier servicio de recurso para proveer CRUD, formularios y utilidades.
 */
@Injectable()
export abstract class BaseResourceService<T = any> {
  /** Nombre del recurso, utilizado como identificador lógico. */
  abstract name: string;

  /** Endpoint de la API REST asociado a este recurso. */
  abstract endpoint: string;

  /** Clave primaria del recurso, usada para identificaciones únicas. */
  abstract primaryKey: string;

  /** Lista de atributos que definen el recurso, incluyendo metadatos de formulario y tabla. */
  abstract attributes: Attribute[];

  /** Información de paginación resultante de una petición getAll. */
  public pagination: IPagination = {
    currentPage: 1,
    lastPage: 1,
    perPage: 0,
    total: 0,
    from: 0,
    to: 0,
  };

  /** Tipo de URL personalizada para el modelo. */
  private _customUrlType?: string;

  /** Formulario reactivo generado a partir de los atributos. */
  public form!: FormGroup;

  /** Arreglo de datos obtenidos desde la API. */
  public items: T[] = [];

  /** Parámetros usados para filtrar peticiones HTTP (e.g., filtros de tabla). */
  public params: HttpParams = new HttpParams();

  /** Endpoint personalizado alternativo (si se define con `from()`). */
  private _customEndpoint?: string;

  /** Indica si el formulario está en modo de visualización. */
  public isShow = false;

  /** Indica si el modelo está en modo de carga. */
  public isLoading = false;

  /** Indica si el modelo está en modo de creación. */
  public isNew = true;

  /** Valor de la clave primaria del modelo. */
  public primaryKeyValue: string | number | null = null;

  /** Inyección de dependencias comunes */
  protected fb = inject(FormBuilder);
  protected formService = inject(FormBuilderService);
  protected httpService = inject(HttpResourceService<T>);

  /** Modo de ejecución para peticiones: 'server' o 'client'. */
  private _executionMode: 'server' | 'client' = 'server';

  initForm(initialData: Partial<T> = {}) {
    this.form = this.formService.buildForm(this.attributes, initialData);
  }

  /**
   * Inicializa el formulario principal del recurso.
   * @param iniDatos opcionales iniciales.
   */
  buildForm(initialData: Partial<T> = {}) {
    return this.formService.buildForm(this.attributes, initialData);
  }

  /**
   * Extrae los valores del formulario de acuerdo a los atributos definidos.
   */
  getValues(): Partial<T> {
    return this.formService.extractFormValues(this.attributes, this.form);
  }

  /** Devuelve un atributo individual por su nombre. */
  getAttribute(name: string): Attribute | undefined {
    return this.attributes.find((a) => a.name === name);
  }

  /** Devuelve todos los atributos definidos del recurso. */
  getAttributes(): Attribute[] {
    return this.attributes;
  }

  /** Devuelve los atributos que tienen definido un input de formulario. */
  getFormAttributes(): Attribute[] {
    return this.attributes.filter((a) => a.input);
  }

  /** Devuelve los atributos que están marcados como listables en tabla. */
  getListableAttributes(): Attribute[] {
    return this.attributes.filter((a) => a.table?.listable);
  }

  /** Devuelve los inputs de formulario asociados a los atributos. */
  getFormInputs(): FormField[] {
    return this.getFormAttributes().map((a) => a.input!);
  }

  /**
   * Devuelve las opciones disponibles para un input tipo select,
   * resolviendo funciones o instancias de ModelSelectOption.
   */
  getSelectOptions(input: FormField): { label: string; value: any }[] {
    const options = input.options;

    if (!options) return [];

    if (typeof options === 'function') {
      const result = options(this);
      return result instanceof ModelSelectOption
        ? result.getOptionsAsArray()
        : result;
    }

    if (options instanceof ModelSelectOption) {
      return options.getOptionsAsArray();
    }

    return options;
  }

  /**
   * Crea un origen para un campo select a partir de datos precargados o remotos.
   * @param label Propiedad o función que representa la etiqueta visible.
   * @param value Propiedad o función que representa el valor del select.
   * @param source Puede ser una función que llene los datos o un array fijo.
   * @param filter Función opcional de filtrado dinámico.
   */
  setSelectSource(
    label: ((item: any) => string) | string,
    value: ((item: any) => any) | string,
    source: ((model: BaseResourceService) => void) | any[],
    filter?: CallableFunction,
  ): ModelSelectOption {
    let model: BaseResourceService;

    if (typeof source === 'function') {
      model = this.new();
      source(model);
      model.paginate(0).getAll();
    } else {
      model = this.new();
      model.items = source;
    }

    return new ModelSelectOption(label, value, model, this, filter);
  }

  /**
   * Establece un endpoint personalizado para las próximas peticiones.
   */
  from(endpoint: string): this {
    this._customEndpoint = endpoint;
    return this;
  }

  /**
   * Agrega un filtro tipo where al endpoint para consulta de datos.
   */
  where(
    column: string,
    operator: '=' | 'not' | 'between' | 'gte' | 'lte' | 'like',
    value: string,
  ): this {
    const suffix = operator === '=' ? '' : `_${operator}`;
    this.params = this.params.set(`${column}${suffix}`, value);
    return this;
  }

  /**
   * Crea una nueva instancia del servicio actual, con herencia de propiedades.
   */
  public new(): this {
    const clone = Object.create(this);
    return clone;
  }

  /** Devuelve el modo actual de ejecución ('server' o 'client'). */
  getExecutionMode(): 'server' | 'client' {
    return this._executionMode;
  }

  /**
   * Define el modo de ejecución para futuras peticiones.
   */
  side(mode: 'server' | 'client'): this {
    this._executionMode = mode;
    this.httpService.setExecutionMode(mode);
    return this;
  }

  /**
   * Obtiene todos los datos del recurso, aplicando los filtros y endpoint configurado.
   * @param onSuccess Callback si se obtiene correctamente.
   * @param onError Callback si hay error en la petición.
   */
  getAll(
    onSuccess?: (data: T[]) => void,
    onError?: (error: any) => void,
  ): void {
    this.isLoading = true;
    const endpoint = this._customEndpoint || this.endpoint;
    this.httpService
      .getAll(endpoint, this.params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const items = response?.data || response;
          this.items = items;
          this.pagination = {
            currentPage: response?.current_page,
            lastPage: response?.last_page,
            perPage: response?.per_page,
            total: response?.total,
            from: response?.from,
            to: response?.to,
          };
          if (onSuccess) onSuccess(items);
        },
        error: (err) => {
          // console.error('Error fetching data:', err?.message || err);
          if (onError) onError(err);
        },
      });
  }

  /** Elimina un recurso por su ID. */
  delete(id: string | number) {
    const endpoint = this._customEndpoint || this.endpoint;
    return this.httpService.delete(endpoint, id);
  }

  /** Envía un POST con el payload del modelo y ejecuta los callbacks si se proporcionan */
  post<R = T>(
    onSuccess?: (data: R) => void,
    onError?: (error: any) => void,
  ): void {
    this.isLoading = true;
    const endpoint = this._customEndpoint || this.endpoint;
    const payload = this.getValues();

    this.httpService
      .post<R>(endpoint, payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          if (onSuccess) onSuccess(res);
        },
        error: (err) => {
          if (onError) onError(err);
        },
      });
  }

  /** Actualiza un recurso existente por ID y maneja callbacks */
  update<R = T>(
    id: string | number,
    onSuccess?: (data: R) => void,
    onError?: (error: any) => void,
  ): void {
    this.isLoading = true;
    const endpoint = this._customEndpoint || this.endpoint;

    this.httpService
      .put<R>(endpoint, id, this.getValues())
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => onSuccess?.(res),
        error: (err) => onError?.(err),
      });
  }

  public initModel(model: this, values: any, pk: any) {
    model.isNew = false;
    model.primaryKeyValue = pk;

    for (const column in values) {
      model.setAttributeValue(column, values[column]);
    }
  }

  protected setAttributeValue(name: string, value: any) {
    const attr = this.attributes.find((item: any) => item.name === name);
    if (attr?.table) {
      attr.table.value = value;
    }
    if (attr?.input) {
      attr.input.bindForm(attr.name, this.form, value);
    }
  }

  /** Obtiene un recurso por ID y maneja callbacks */
  show<R = T>(
    id: string | number,
    onSuccess?: (data: R) => void,
    onError?: (error: any) => void,
  ): void {
    this.isLoading = true;
    const endpoint = this._customEndpoint || this.endpoint;

    this.httpService
      .show<R>(endpoint, id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          this.initModel(this, res, id);
          onSuccess?.(res);
        },
        error: (err) => onError?.(err),
      });
  }

  /**
   * Paginación de resultados, estableciendo el número de elementos por página y la página actual.
   * @param perPage Número de elementos por página.
   * @param page Página actual (por defecto es 1).
   */

  public paginate(perPage: number, page = 1): this {
    this.params = this.params?.set('per_page', perPage?.toString());
    this.params = this.params?.set('page', page?.toString());

    return this;
  }

  /**
   * Establece la página actual para la paginación.
   * @param perPage Número de elementos por página (por defecto es 1).
   */

  public setPage(perPage = 1) {
    this.params = this.params?.set('page', perPage?.toString());

    return this;
  }

  /**
   * Obtiene el número de la página actual de los parámetros de paginación.
   * Si no se ha establecido, devuelve 1 por defecto.
   */

  public getPage(): number {
    return parseInt(this.params?.get('page') || '');
  }

  /**
   * Establece el número de elementos por página para la paginación.
   * @param page Número de elementos por página.
   */

  public setPerPage(page: number) {
    this.params = this.params?.set('per_page', page.toString());

    return this;
  }

  /**
   * Obtiene el número de elementos por página de los parámetros de paginación.
   * Si no se ha establecido, devuelve 0 por defecto.
   */

  public getPerPage(): number {
    return parseInt(this.params?.get('per_page') || '');
  }

  /**
   * Establece los parámetros HTTP para las peticiones.
   * @param params Parámetros a establecer.
   */

  setParams(params: HttpParams): this {
    this.params = params;
    return this;
  }

  /**
   * Obtiene los parámetros HTTP actuales.
   * Si no se han establecido, devuelve un nuevo HttpParams vacío.
   */

  getParams(): HttpParams {
    return this.params ?? new HttpParams();
  }

  /**
   * Establece un tipo de URL personalizada para el modelo.
   */
  setCustomUrl(urlType: string): this {
    this._customUrlType = urlType;
    this.httpService.setUrlType('custom');
    this.httpService.setCustomUrl(urlType);
    return this;
  }
}
