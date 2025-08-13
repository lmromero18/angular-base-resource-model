import { FormGroup, ValidatorFn } from "@angular/forms";
import { ISelectOption } from "./field-types";
import { ModelSelectOption } from "./select-option.model";

export class FormField {
    type: string;
    required?: boolean;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
    visible?: boolean;
    options?: ModelSelectOption | ISelectOption[] | ((model: any) => ModelSelectOption[] | ISelectOption[]);
    setter?: (value: any) => string | HTMLElement;
    change?: (value: any) => void;
    validators?: ValidatorFn[];

    private _value?: any;

    constructor(config: {
        type: string;
        required?: boolean;
        placeholder?: string;
        class?: string;
        disabled?: boolean;
        visible?: boolean;
        options?: ModelSelectOption | ISelectOption[] | ((model: any) => ModelSelectOption[] | ISelectOption[]);
        setter?: (value: any) => string | HTMLElement;
        change?: (value: any) => void;
        validators?: ValidatorFn[];
        value?: any;
    }) {
        this.type = config.type;
        this.required = config.required;
        this.placeholder = config.placeholder;
        this.class = config.class;
        this.disabled = config.disabled;
        this.visible = config.visible;
        this.options = config.options;
        this.setter = config.setter;
        this.change = config.change;
        this.validators = config.validators;
        this.value = config.value ?? null;
    }

    get value(): any {
        return this._value;
    }

    set value(val: any) {
        this._value = val;
    }

    bindForm(name: string, form: FormGroup): void {
        const control = form.get(name);
        if (!control) return;

        // Si el control ya tiene un valor, lo aplicamos usando el setter si existe
        const initialValue = control.value;
        this._value = this.setter ? this.setter(initialValue) : initialValue;

        // Escuchar cambios en el formulario
        control.valueChanges.subscribe((newVal) => {
            this._value = this.setter ? this.setter(newVal) : newVal;
            this.change?.(this._value);
        });

        // Escuchar cambios externos (cuando alguien hace control['externalValue'] = ...)
        Object.defineProperty(control, 'externalValue', {
            set: (val: any) => {
                this._value = this.setter ? this.setter(val) : val;
                control.setValue(val);
            },
            get: () => this._value
        });
    }

}
