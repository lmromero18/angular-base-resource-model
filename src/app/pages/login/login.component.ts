import { Component, Injector } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormComponent } from '../../components/form/form.component';
import { ControllerComponent } from '../../core/base/controller';
import { IAuthResponse } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { LoginService } from './login.service';
import { redirectTo } from '../../utils/route-utils';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormComponent, ReactiveFormsModule],
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
}
