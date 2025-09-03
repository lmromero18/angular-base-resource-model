/**
 * Tipo para los diferentes tipos de entrada en un formulario.
 */
export type TFormFieldInputType = 'text' | 'password' | 'select' | 'hidden';

/**
 * Interfaz para las opciones de un campo de selección.
 */
export interface ISelectOption {
  label: string;
  value: any;
}

/**
 * Interfaz para las propiedades de un campo en una tabla.
 */
export interface ITableField {
  listable?: boolean;
  class?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filtrable?: boolean;
  formatter?: (row: any) => string;
  value?: any;
}

export type ValueOrFn<T, A = unknown> = T | ((arg?: A) => T);

export const resolve = <T, A = unknown>(v: ValueOrFn<T, A>, a?: A): T =>
  typeof v === 'function' ? (v as (x?: A) => T)(a) : v;

// Acciones "base" conocidas
export type BuiltInActionName = 'create' | 'read' | 'update' | 'delete' | 'download';

// Si quieres permitir personalizadas, ActionKey es un string cualquiera.
export type ActionKey = BuiltInActionName | (string & {});

// Ítem genérico (reemplázalo por tu tipo real si quieres tiparlo)
export type Item = Record<string, unknown>;

/** Interfaz base para cualquier botón de acción */
export interface BaseActionButton<TItem = Item> {
  name?: ActionKey;
  section?: ValueOrFn<string, TItem>;
  text?: ValueOrFn<string, TItem>;
  html?: ValueOrFn<unknown, TItem>;
  can?: ValueOrFn<boolean, TItem>;
  disable?: ValueOrFn<boolean, TItem>;
  icon?: ValueOrFn<string, TItem>;
  class?: ValueOrFn<string, TItem>;
  link?: ValueOrFn<string, TItem>;
  click?: (item?: TItem) => void;
  tooltip?: ValueOrFn<string, TItem>;
}

/** Acción de descarga con allowedTypes */
export interface DownloadActionButton<TItem = Item> extends BaseActionButton<TItem> {
  name: 'download';
  allowedTypes?: ValueOrFn<string[], TItem>;
}

/** Unión para cualquier botón */
export type ActionButton<TItem = Item> =
  | BaseActionButton<TItem>
  | DownloadActionButton<TItem>;

/** Mapa de acciones: permitimos claves libres para agregar personalizadas */
export type Actions<TItem = Item> = Record<ActionKey, ActionButton<TItem>>;

