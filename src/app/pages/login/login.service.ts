import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { Attribute } from '../../core/models/attribute.model';
import { FormField } from '../../core/models/form-field.model';
import { BaseResourceService } from '../../core/services/base/base-resource.service';

@Injectable({ providedIn: 'root' })
export class LoginService extends BaseResourceService {
  override name = 'Login';
  override endpoint = 'auth/login';
  override primaryKey = 'id_oficina';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'username',
      label: 'Correo/Usuario',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'contrasena',
      label: 'Contraseña',
      input: new FormField({
        type: 'password',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
  ];
}
