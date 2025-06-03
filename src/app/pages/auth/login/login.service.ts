import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { Attribute } from '../../../core/models/attribute.model';
import { FormField } from '../../../core/models/form-field.model';
import { BaseResourceService } from '../../../core/services/base/base-resource.service';

@Injectable({ providedIn: 'root' })
export class LoginService extends BaseResourceService {

  override name = 'Login';
  override endpoint = 'v1/auth/login';
  override primaryKey = 'id_oficina';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'username',
      label: 'Correo electrónico',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'password',
      label: 'Contraseña',
      input: new FormField({
        type: 'password',
        required: true,
        class: 'col-span-12',
        setter(value) {
          return value ? btoa(value) : '';
        },
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'tx_oficina',
      label: 'Nombre de la Oficina',
      input: new FormField({
        type: 'select',
        options: this.setSelectSource(
          'nb_oficina',
          'co_oficina',
          (model: BaseResourceService) => model.from('v1/prueba/oficina')

        ),
        required: true,
        class: 'col-span-12',
      }),
    }),
  ];
}
