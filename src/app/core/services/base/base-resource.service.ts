import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Attribute } from '../../models/attribute.model';
import { FormField } from '../../models/form-field.model';
import { FormBuilderService } from './form-builder.service';
import { HttpResourceService } from './http-resource.service';
import { ModelSelectOption } from '../../models/select-option.model';
import { IPagination } from '../../models/paginated-response.model';
import { finalize, Observable } from 'rxjs';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { ActionButton, Actions, ActionKey, resolve, ValueOrFn } from '../../models/core.types';

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

  /**
   * Constructor para inicializar el servicio.
   */
  constructor() {
    this.boot();
  }

  /**
   * Inicializa otros recursos necesarios.
   */
  public boot() { }

  /** Permisos disponibles para el recurso. */
  public permissions: Record<string, string | boolean> = {
    create: '',
    read: '',
    update: '',
    delete: '',
  };

  /**
   * Acciones disponibles para el recurso.
   */
  public actions: Actions<T> = this.buildDefaultActions();

  /** Fábrica de acciones por defecto (usa this.primaryKey) */
  protected buildDefaultActions(): Actions<T> {
    return {
      create: {
        name: 'create',
        text: 'Crear',
        can: true,
        class: 'btn-primary',
        link: 'Crear',
        icon: 'plus',
        tooltip: 'Crear',
      },
      read: {
        name: 'read',
        can: true,
        disable: false,
        class: 'btn text-dark-300',
        link: (item: any) => `Detalle/${item?.[this.primaryKey]}`,
        icon: 'eye',
        tooltip: 'Detalle',
        text: 'Detalles',
      },
      update: {
        name: 'update',
        can: true,
        disable: false,
        class: 'btn text-dark-300',
        link: (item: any) => `Editar/${item?.[this.primaryKey]}`,
        icon: 'edit',
        tooltip: 'Editar',
        text: 'Editar',
      },
      delete: {
        name: 'delete',
        can: true,
        disable: false,
        class: 'btn text-danger',
        icon: 'delete',
        tooltip: 'Eliminar',
        text: 'Eliminar',
        click: (item: any) => this.delete(item?.[this.primaryKey] ?? item),
      },
      download: {
        name: 'download',
        can: true,
        disable: true,
        class: 'btn-light-600',
        icon: 'download',
        tooltip: 'Descargar',
        text: 'Descargar',
        allowedTypes: ['XLSX'],
        click: () => { },
      },
    };
  }


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
   * Construye en enpoint
   */
  getEndpoint() {
    return this._customEndpoint || this.endpoint;
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
    const endpoint = this.getEndpoint();
    this.httpService.getAll(endpoint, this.params).subscribe({
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
        this.isLoading = false;
        if (onSuccess) onSuccess(items);
      },
      error: (err) => {
        this.isLoading = false;
        if (onError) onError(err);
      },
    });
  }

  /** Elimina un recurso por su ID. */
  delete(id: string | number) {
    const endpoint = this.getEndpoint();
    return this.httpService.delete(endpoint, id);
  }

  /** Envía un POST con el payload del modelo y ejecuta los callbacks si se proporcionan */
  post<R = T>(
    onSuccess?: (data: R) => void,
    onError?: (error: any) => void,
  ): void {
    this.isLoading = true;
    const endpoint = this.getEndpoint();
    const payload = this.getValues();

    this.httpService.post<R>(endpoint, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (onSuccess) onSuccess(res);
      },
      error: (err) => {
        this.isLoading = false;
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
    const endpoint = this.getEndpoint();

    this.httpService.patch<R>(endpoint, id, this.getValues()).subscribe({
      next: (res) => {
        this.isLoading = false;
        onSuccess?.(res);
      },
      error: (err) => {
        this.isLoading = false;
        onError?.(err);
      },
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
    const endpoint = this.getEndpoint();

    this.httpService.show<R>(endpoint, id).subscribe({
      next: (res) => {
        this.initModel(this, res, id);
        this.isLoading = false;
        onSuccess?.(res);
      },
      error: (err) => {
        this.isLoading = false;
        onError?.(err);
      },
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

  /**
   * Obtiene los atributos filtrables del modelo.
   * @returns Un array de atributos filtrables.
   */
  public filtrables() {
    return this.attributes.filter(
      (item: Attribute) => item?.table?.filtrable && item.input,
    );
  }

  /**
   * Obtiene los filtros aplicados al modelo.
   * @returns Un array de filtros aplicados.
   */
  public getFilters(): Attribute[] {
    if (this.notFiltrables().length > 0) {
      this.notFiltrables().forEach((filter) => {
        this.form.get(filter?.name)?.setValidators(null);
      });
    }

    return (
      this.filtrables()
        // .sort((a, b) => a.filter_order - b.filter_order)
        .map((item: Attribute) => {
          const input = item;
          // if (!input.validateFilter) {
          //   input.formControl.setValidators(null);
          // }

          return input;
        })
    );
  }

  /**
   * Obtiene los atributos que no son filtrables.
   * @returns Un array de atributos que no son filtrables.
   */
  public notFiltrables() {
    return this.attributes.filter(
      (item: Attribute) => !item?.table?.filtrable && item.input,
    );
  }

  /**
   * Limpiar valores de los filtros
   */
  clearFilters() {
    this.form.reset();
    this.getFilters().map((element) => {
      this.form.get(element?.name)?.setValue(null);
      if (element.input) {
        element.input.value = null;
        this.form.get(element?.name)?.updateValueAndValidity();
      }
    });
  }

  /**
   * Guarda los datos actuales en el servidor.
   * Si los datos son nuevos, se crearán. Si ya existen, se actualizarán.
   * @param afterSavedCallBack Función que se llamará después de guardar exitosamente.
   * Si no se proporciona, se mostrará un mensaje de éxito.
   * @param onErrorCallback Función que se llamará si ocurre un error durante la petición.
   * Si no se proporciona, se mostrará un mensaje de error.
   * @returns Una suscripción que puede ser utilizada para cancelar la petición.
   */
  public save(
    afterSavedCallBack?: CallableFunction,
    onErrorCallback?: CallableFunction,
  ) {
    this.isLoading = true;
    let url = this.getEndpoint();
    const values = this.getValues();

    // if (values instanceof FormData) {
    //   let httpMethod: string = 'POST';
    //   if (!this.isNew) {
    //     values.append('_method', 'PATCH');
    //   }
    // }

    const body: { body?: FormData | any } = values;

    let httpRequest = this.isNew
      ? this.httpService.post(url, body)
      : this.httpService.patch(url, this.primaryKeyValue!, body);

    return httpRequest.subscribe({
      next: (data) => {
        if (afterSavedCallBack) {
          this.isLoading = false;
          return afterSavedCallBack(data);
        }

        // this.messageService.createMessage({
        //   type: 'success',
        //   message: this.isNew ? 'Creación exitosa' : 'Actualización exitosa',
        //   options: {
        //     nzPauseOnHover: true,
        //     nzDuration: 3500,
        //   },
        // });
        this.isLoading = false;
        this.clearFilters();
      },
      error: (err) => {
        if (onErrorCallback) {
          return onErrorCallback(err);
        }
      },
    });
  }

  /** Obtiene una acción por nombre (incluye personalizadas) */
  public getActionButton(name: ActionKey): ActionButton<T> {
    return this.actions[name];
  }

  /**
   * Obtiene los botones de acción para un elemento específico.
   * @param item El elemento para el cual obtener los botones de acción.
   * @param opts Opciones adicionales para filtrar los botones de acción.
   * @returns Un array de nombres de botones de acción.
   */

  public getActionButtons(
    item?: T,
    opts?: {
      include?: string[];      // solo estas
      exclude?: string[];      // excluir estas
      section?: string;        // si usas secciones
      sort?: (a: string, b: string) => number; // orden personalizado
      onlyEnabled?: boolean;   // omite las disabled
      onlyAllowed?: boolean;   // omite las que can=false
    },
  ): string[] {
    const keys = Object.keys(this.actions);

    const filtered = keys.filter((name) => {
      const a = this.actions[name];
      if (!a) return false;

      if (opts?.include && !opts.include.includes(name)) return false;
      if (opts?.exclude && opts.exclude.includes(name)) return false;
      if (opts?.section) {
        const sec = typeof a.section === 'function' ? a.section(item) : a.section;
        if (sec !== opts.section) return false;
      }
      if (opts?.onlyAllowed && !this.can(name, item)) return false;
      if (opts?.onlyEnabled && this.isDisabled(name, item)) return false;

      return true;
    });

    return opts?.sort ? filtered.sort(opts.sort) : filtered;
  }

  /** Agrega o reemplaza una acción (personalizadas soportadas) */
  public addAction(name: ActionKey, options: ActionButton<T>) {
    this.actions[name] = { ...options, name };
  }

  /** Setters genéricos (evitan duplicados por acción) */
  public setCan(name: ActionKey, v: ValueOrFn<boolean, T>) {
    if (!this.actions[name]) return;
    this.actions[name].can = v;
  }
  public setDisabled(name: ActionKey, v: ValueOrFn<boolean, T>) {
    if (!this.actions[name]) return;
    this.actions[name].disable = v;
  }
  public setAllowedTypes(v: ValueOrFn<string[], T>) {
    const a = this.actions['download'];
    if (!a) return;
    (a as any).allowedTypes = v;
  }

  // Atajos semánticos para las acciones built-in (si te gustan)
  public get createButton(): ActionButton<T> { return this.actions['create']; }
  public get downloadButton(): ActionButton<T> { return this.actions['download']; }

  // ======== EVALUADORES UNIFORMES (valor o función) ========

  public can(name: ActionKey, item?: T): boolean {
    const a = this.actions[name];
    return a ? resolve(a.can ?? true, item) : false;
  }

  public isDisabled(name: ActionKey, item?: T): boolean {
    const a = this.actions[name];
    return a ? resolve(a.disable ?? false, item) : true;
  }

  public label(name: ActionKey, item?: T): string {
    const a = this.actions[name];
    return a ? String(resolve(a.text ?? '', item)) : '';
  }

  public css(name: ActionKey, item?: T): string {
    const a = this.actions[name];
    return a ? String(resolve(a.class ?? '', item)) : '';
  }

  public href(name: ActionKey, item?: T): string | undefined {
    const a = this.actions[name];
    const link = a?.link;
    return link ? resolve(link, item) : undefined;
  }

  public iconOf(name: ActionKey, item?: T): string | undefined {
    const a = this.actions[name];
    const ic = a?.icon;
    return ic ? resolve(ic, item) : undefined;
  }

  public allowedTypes(name: 'download' = 'download', item?: T): string[] {
    const a = this.actions[name] as any;
    const at = a?.allowedTypes;
    return at ? resolve<string[], T>(at, item) : [];
  }

  public click(name: ActionKey, item?: T) {
    const a = this.actions[name];
    a?.click?.(item);
  }

  // ======== (Opcional) deprecación de setters específicos ========
  // Si quieres mantener compatibilidad temporal con tu API anterior:
  public set canCreate(v: any) { this.setCan('create', v); }
  public get canCreate() { return this.getActionButton('create')?.can; }

  public set canRead(v: any) { this.setCan('read', v); }
  public get canRead() { return this.getActionButton('read')?.can; }

  public set canUpdate(v: any) { this.setCan('update', v); }
  public get canUpdate() { return this.getActionButton('update')?.can; }

  public set canDelete(v: any) { this.setCan('delete', v); }
  public get canDelete() { return this.getActionButton('delete')?.can; }

  public set canDownload(v: any) { this.setCan('download', v); }
  public get canDownload() { return this.getActionButton('download')?.can; }

  public set disableUpdate(v: any) { this.setDisabled('update', v); }
  public get disableUpdate() { return this.getActionButton('update')?.disable; }

  public set disableRead(v: any) { this.setDisabled('read', v); }
  public get disableRead() { return this.getActionButton('read')?.disable; }

  public set disableDelete(v: any) { this.setDisabled('delete', v); }
  public get disableDelete() { return this.getActionButton('delete')?.disable; }

  public set disableDownload(v: any) { this.setDisabled('download', v); }
  public get disableDownload() { return this.getActionButton('download')?.disable; }

  public set allowedTypesDownload(v: any) { this.setAllowedTypes(v); }
  public get allowedTypesDownload() { return (this.actions['download'] as any)?.allowedTypes; }

  // public setAfter(callback: CallableFunction) {
  //   this.afterListResponse = callback;

  //   return this;
  // }
}
