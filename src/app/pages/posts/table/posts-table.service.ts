import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseResourceService } from '../../../core/services/base/base-resource.service';
import { Attribute } from '../../../core/models/attribute.model';
import { FormField } from '../../../core/models/form-field.model';

@Injectable({
  providedIn: 'root',
})
export class PostsTableService extends BaseResourceService {
  override name = 'Posts';
  override endpoint = 'posts';
  override primaryKey = 'id';

  override attributes: Attribute[] = [
    new Attribute({
      name: 'id',
      label: 'ID',
      input: new FormField({
        type: 'number',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'title',
      label: 'Title',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
    new Attribute({
      name: 'content',
      label: 'Content',
      input: new FormField({
        type: 'text',
        required: true,
        class: 'col-span-12',
        validators: [Validators.required],
      }),
    }),
  ];
}
