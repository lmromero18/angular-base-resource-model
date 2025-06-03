import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { Attribute } from '../../core/models/attribute.model';
import { BaseResourceService } from '../../core/services/base/base-resource.service';
import { FormField } from '../../core/models/form-field.model';

@Injectable({ providedIn: 'root' })
export class ParametroSistemaService extends BaseResourceService {

  override name = 'Oficina';
  override endpoint = 'v1/oficina';
  override primaryKey = 'id_oficina';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'co_oficina',
      label: 'Oficina',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'nb_oficina',
      label: 'Nombre de la Oficina',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
  ];
}
