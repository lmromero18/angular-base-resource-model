import { FormField, TableField } from './field-types';
import { ValidatorFn } from '@angular/forms';

export class Attribute {
    name!: string;
    label!: string;
    input?: FormField;
    table?: TableField;
    validators?: ValidatorFn[];

    constructor(config: {
        name: string;
        label: string;
        input?: FormField;
        table?: TableField;
    }) {
        this.name = config.name;
        this.label = config.label;
        this.input = config.input;

        this.table = {
            listable: config.table?.listable ?? true,
            class: config.table?.class ?? 'text-left',
            width: config.table?.width ?? 'auto',
            align: config.table?.align ?? 'left',
            ...config.table,
        };
    }
}
