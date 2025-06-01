import { ValidatorFn } from "@angular/forms";

export interface SelectOption {
    label: string;
    value: any;
}

export interface FormField {
    type: string
    required?: boolean;
    placeholder?: string;
    inputType?: string;
    class?: string;
    disabled?: boolean;
    visible?: boolean;
    options?: SelectOption[];
    setter?: (value: any) => string | HTMLElement;
    validators?: ValidatorFn[];
}

export interface TableField {
    listable?: boolean;
    class?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    formatter?: (row: any) => string;
}

export interface Attribute {
    name: string;
    label: string;

    input?: FormField;
    table?: TableField;
}