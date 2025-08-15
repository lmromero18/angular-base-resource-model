import { FormGroup } from '@angular/forms';
import { Injector, Type } from '@angular/core';
import { BaseResourceService } from '../services/base/base-resource.service';
import { ActivatedRoute } from '@angular/router';

export abstract class ControllerComponent<T extends BaseResourceService> {
  protected _form!: FormGroup;
  public model: T;
  public isShow: boolean = false;

  constructor(
    protected injector: Injector,
    protected modelClass: Type<T>,
  ) {
    this.model = this.injector.get(modelClass);
    this.model.initForm();
  }

  initForm(initialData: any = {}): void {
    this._form = this.model.buildForm(initialData);
  }

  queryRoute(query: CallableFunction): void {
    this.injector.get(ActivatedRoute).params.subscribe((params) => {
      const id = params['id'];

      if (id) {
        query(id);
        this.injector.get(ActivatedRoute).data.subscribe((data) => {
          this.isShow = data['isShow'];

          this.model.isShow = this.isShow ?? false;
          if (data['isShow']) {
            this.model.attributes.map((attr) => {
              if (attr.input) {
                attr.input.disabled = true;
              }
            });
          }
        });
      }
    });
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
