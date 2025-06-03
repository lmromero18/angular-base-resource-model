export interface SelectOption {
    label: string;
    value: any;
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
