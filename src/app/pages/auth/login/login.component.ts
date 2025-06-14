import { Component, inject, Injector, REQUEST } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { FormComponent } from '../../../components/form/form.component';
import { ControllerComponent } from '../../../core/base/controller';
import { IAuthResponse } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LoginService } from './login.service';

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
    public router: Router
  ) {
    super(injector, LoginService);
  }

  /**
   * Realiza la solicitud de login al backend usando `model.create()`
   * y guarda el token si el login fue exitoso.
   * @returns Observable con la respuesta del login
   */
  public submitFn = () =>
    this.model.post<IAuthResponse>(
      (res) => {
        this.authService.savePayload(res);
        this.router.navigate(['/parametro-sistema']);
      },
      (err) => {
        console.error('❌ Error al iniciar sesión:', err);
      }
    );


  ngDoCheck() {
    console.log(this.model.getAttribute('username')?.input?.value);
    console.log(this.model.getAttribute('password')?.input?.value);
  }
}
