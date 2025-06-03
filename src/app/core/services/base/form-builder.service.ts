import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Attribute } from '../../models/attribute.model';
import { FormField } from '../../models/form-field.model';

/**
 * Servicio encargado de construir formularios dinámicos a partir de atributos
 * declarados en el modelo (`Attribute[]`), y de extraer valores del formulario
 * según las configuraciones establecidas.
 */
@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  constructor(private fb: FormBuilder) {}

  /**
   * Construye un `FormGroup` dinámicamente con base en los atributos dados.
   * Cada campo se inicializa con los datos proporcionados y aplica validaciones
   * como `Validators.required` si así lo define el atributo.
   *
   * Además, si el campo (`input`) es una instancia de `FormField`, se realiza un `bindForm`
   * para conectar lógicamente el campo con el formulario.
   *
   * @param attributes - Lista de atributos que definen los campos del formulario.
   * @param initialData - Objeto con valores iniciales para el formulario.
   * @returns Un objeto `FormGroup` listo para usar en la vista.
   */
  buildForm(attributes: Attribute[], initialData: any = {}): FormGroup {
    const group: { [key: string]: any } = {};

    for (const attr of attributes) {
      const validators = attr.input?.required ? [Validators.required] : [];
      const value = initialData[attr.name] ?? '';
      group[attr.name] = [value, validators];
    }

    const form = this.fb.group(group);

    for (const attr of attributes) {
      if (attr.input instanceof FormField) {
        attr.input.bindForm(attr.name, form);
      }
    }

    return form;
  }

  /**
   * Extrae los valores de un `FormGroup` respetando las reglas personalizadas
   * de cada campo (`setter`) si están definidas.
   *
   * @param attributes - Lista de atributos utilizados para construir el formulario.
   * @param form - Instancia del `FormGroup` desde donde se extraerán los valores.
   * @returns Objeto plano con los valores del formulario listos para enviar al backend.
   */
  extractFormValues(attributes: Attribute[], form: FormGroup): any {
    const values: any = {};
    for (const attr of attributes) {
      let value = form.get(attr.name)?.value;
      if (attr.input?.setter) {
        value = attr.input.setter(value);
      }
      values[attr.name] = value;
    }
    return values;
  }
}
