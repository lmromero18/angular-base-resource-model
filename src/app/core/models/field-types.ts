export interface ISelectOption {
    label: string;
    value: any;
}

export interface ITableField {
    listable?: boolean;
    class?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    formatter?: (row: any) => string;
}
