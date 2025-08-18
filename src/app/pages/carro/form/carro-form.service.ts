import { Injectable } from '@angular/core';
import { BaseResourceService } from '../../../core/services/base/base-resource.service';
import { Attribute } from '../../../core/models/attribute.model';
import { FormField } from '../../../core/models/form-field.model';

@Injectable({
  providedIn: 'root',
})
export class CarroFormService extends BaseResourceService {
  override name = 'Carro';
  override endpoint = 'carro';
  override primaryKey = 'id';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'id',
      label: 'ID',
      input: new FormField({
        type: 'hidden',
        class: 'col-span-12',
      }),
    }),
    new Attribute({
      name: 'nb_marca',
      label: 'Marca',
      input: new FormField({
        type: 'text',
        required: false,
        class: 'col-span-12',
      }),
    }),
    new Attribute({
      name: 'nb_modelo',
      label: 'Modelo',
      input: new FormField({
        type: 'text',
        required: false,
        class: 'col-span-12',
      }),
    }),
    new Attribute({
      name: 'nu_anio',
      label: 'Año',
      input: new FormField({
        type: 'text',
        required: false,
        class: 'col-span-12',
      }),
    }),
    new Attribute({
      name: 'mo_monto',
      label: 'Monto',
      input: new FormField({
        type: 'text',
        required: false,
        class: 'col-span-12',
      }),
    }),
    new Attribute({
      name: 'is_disponible',
      label: 'Disponible',
      input: new FormField({
        type: 'text',
        required: false,
        class: 'col-span-12',
      }),
    }),
  ];
}
