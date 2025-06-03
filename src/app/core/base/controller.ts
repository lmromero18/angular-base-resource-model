import { FormGroup } from '@angular/forms';
import { Injector, Type } from '@angular/core';
import { BaseResourceService } from '../services/base/base-resource.service';

export abstract class ControllerComponent<T extends BaseResourceService> {
  protected _form!: FormGroup;
  public model: T;

  constructor(
    protected injector: Injector,
    protected modelClass: Type<T>
  ) {
    this.model = this.injector.get(modelClass);
    this.model.initForm();
  }

  initForm(initialData: any = {}): void {
    this._form = this.model.buildForm(initialData);
  }

  get form(): FormGroup {
    return this._form;
  }

  get formFields() {
    return this.model.getFormAttributes();
  }

  get tableColumns() {
    return this.model.getListableAttributes();
  }
}
