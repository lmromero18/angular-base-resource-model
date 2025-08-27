import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseResourceService } from '../../core/services/base/base-resource.service';
import { Attribute } from '../../core/models/attribute.model';
import { Observable, Subscription } from 'rxjs';
import { ModelSelectOption } from '../../core/models/select-option.model';
import { FormField } from '../../core/models/form-field.model';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {
  @Input() model!: BaseResourceService;
  @Input() customSubmit?: () => void;
  @Output() submitted = new EventEmitter<void>();

  form!: FormGroup;
  fields!: Attribute[];

  ngOnInit(): void {
    this.form = this.model.form;
    this.fields = this.model.getFormAttributes();

    let select = this.fields.find((attr) => attr.input?.type === 'select');
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.customSubmit) {
        this.customSubmit();
      } else {
        this.model.save();
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  getSelectOptions(input: FormField): { label: string; value: any }[] {
    return this.model.getSelectOptions(input);
  }
}
