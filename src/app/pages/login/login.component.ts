import { afterEveryRender, Component, Injector } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormComponent } from '../../components/form/form.component';
import { ControllerComponent } from '../../core/base/controller';
import { IAuthResponse } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { LoginService } from './login.service';
import { redirectTo } from '../../utils/route-utils';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormComponent, ReactiveFormsModule, CommonModule],
})
export class LoginComponent extends ControllerComponent<LoginService> {
  constructor(
    injector: Injector,
    public authService: AuthService,
    public router: Router,
  ) {
    super(injector, LoginService);

  }

  /**
   * Realiza la solicitud de login al backend usando `model.create()`
   * y guarda el token si el login fue exitoso.
   * @returns Observable con la respuesta del login
   */
  public customSubmit = () =>
    this.model.post<IAuthResponse>(
      (res) => {
        this.form.reset();
        redirectTo('/carro');
      },
      (err) => {
        this.form.reset();
      },
    );

    ngOnInit(): void {
      // this.model.getAll((carro: ICarro[]) => {
      //   console.log(carro);
      //   console.log(this.model.pagination);
      // });

      this.model.addAction('ver_detalle', {
        text: () => "Ver detalle",
        can: () => true,
        disable: (item: any) => false,
        class: () => "btn text-dark-300",
        link: (item: any) => "Visualizar/" + item[this.model.primaryKey],
        icon: () => "eye",
        tooltip: () => "Ver detalle",
        click: () => {
        }
      });
    }
}
