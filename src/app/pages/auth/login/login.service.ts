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
    // new Attribute({
    //   name: 'co_serie',
    //   label: 'Serie',
    //   input: new FormField({
    //     type: 'select',
    //     options: this.setSelectSource(
    //       'co_serie',
    //       'co_serie',
    //       (model: BaseResourceService) => model.from('v1/prueba/oficina')

    //     ),
    //     required: true,
    //     class: 'col-span-12',
    //     change: (value: any) => {
    //       console.log('Selected Serie:', value);
    //     }
    //   }),
    // }),
  ];
}
