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
    }),
    new Attribute({
      name: 'title',
      label: 'Title',
    }),
    new Attribute({
      name: 'content',
      label: 'Content',
    }),
  ];
}
