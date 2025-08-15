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
  filterable?: boolean;
  formatter?: (row: any) => string;
  value?: any;
}
