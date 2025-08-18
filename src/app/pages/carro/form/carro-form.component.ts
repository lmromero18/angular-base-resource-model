import { Component, Injector, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormComponent } from '../../../components/form/form.component';
import { ControllerComponent } from '../../../core/base/controller';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CarroFormService } from './carro-form.service';

@Component({
  selector: 'app-carro',
  templateUrl: './carro-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, FormComponent],
})
export class CarroFormComponent
  extends ControllerComponent<CarroFormService>
  implements OnInit
{
  constructor(
    injector: Injector,
    public authService: AuthService,
  ) {
    super(injector, CarroFormService);
  }

  ngOnInit(): void {
    this.queryRoute((id: string) => {
      this.model.show(id, (data) => {
        console.log(data);
      });
    });
  }
}
