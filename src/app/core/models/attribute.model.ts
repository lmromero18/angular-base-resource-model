import { ITableField } from './core.types';
import { ValidatorFn } from '@angular/forms';
import { FormField } from './form-field.model';

export class Attribute {
  name!: string;
  label!: string;
  input?: FormField;
  table?: ITableField;
  validators?: ValidatorFn[];

  constructor(config: {
    name: string;
    label: string;
    input?: FormField;
    table?: ITableField;
  }) {
    this.name = config.name;
    this.label = config.label;

    this.input = config.input
      ? new FormField({
          type: config.input.type,
          required: config.input.required ?? false,
          placeholder: config.input.placeholder,
          class: config.input.class,
          disabled: config.input.disabled ?? false,
          visible: config.input.visible ?? true,
          options: config.input.options,
          setter: config.input.setter,
          change: config.input.change,
          validators: config.input.validators,
        })
      : undefined;

    this.table = {
      listable: config.table?.listable ?? true,
      class: config.table?.class ?? 'text-left',
      width: config.table?.width ?? 'auto',
      align: config.table?.align ?? 'left',
      ...config.table,
    };
  }
}
