import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseResourceService } from '../../core/services/base-resource.service';
import { Attribute } from '../../core/models/attribute.model';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {
    @Input() model!: BaseResourceService;
    @Input() submitFn?: () => Observable<any>;
    @Output() submitted = new EventEmitter<void>();

    form!: FormGroup;
    fields!: Attribute[];

    ngOnInit(): void {
        this.form = this.model.form;
        this.fields = this.model.getFormAttributes();
    }

    onSubmit() {
        if (this.form.valid) {
            const executeSubmit = this.submitFn ?? (() => this.model.create());

            executeSubmit().subscribe({
                next: () => this.submitted.emit(),
                error: (err) => console.error('❌ Error en el submit:', err),
            });

        } else {
            this.form.markAllAsTouched();
            console.warn('⚠️ Formulario inválido');
        }
    }
}

