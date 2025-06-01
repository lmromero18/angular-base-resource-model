import { inject, Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseResourceService } from '../../../core/services/base-resource.service';
import { Attribute } from '../../../core/models/attribute.model';

@Injectable({ providedIn: 'root' })
export class LoginService extends BaseResourceService {

  override name = 'Login';
  override endpoint = 'v1/auth/login';
  override primaryKey = 'id_oficina';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'username',
      label: 'Correo electrónico',
      input: {
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      },
    }),
    new Attribute({
      name: 'password',
      label: 'Contraseña',
      input: {
        type: 'password',
        required: true,
        class: 'col-span-12',
        setter(value) {
            return value ? btoa(value) : '';
        },
        validators: [Validators.required],
      },
    }),
  ];
}
