import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  makeStateKey,
  TransferState,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormComponent } from '../../components/form/form.component';
import { ControllerComponent } from '../../core/base/controller';
import { IS_AUTHENTICATED_KEY } from '../../core/core.states.key';
import { IAuthResponse } from '../../core/models/auth.model';
import { redirectTo } from '../../utils/route-utils';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormComponent, ReactiveFormsModule, CommonModule],
})
export class LoginComponent extends ControllerComponent<LoginService> {
  constructor(
    injector: Injector,
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
        // Mark authenticated in TransferState for SPA navigations
        const IS_AUTHENTICATED_STATE_KEY =
          makeStateKey<boolean>(IS_AUTHENTICATED_KEY);
        const transferState = this.injector.get(TransferState);
        transferState.set(IS_AUTHENTICATED_STATE_KEY, true);
        redirectTo('/carro');
      },
      (err) => {
        this.form.reset();
      },
    );

  ngOnInit(): void {
    this.model.addAction('ver_detalle', {
      text: () => 'Ver detalle',
      can: () => true,
      disable: (item: any) => false,
      class: () => 'btn text-dark-300',
      link: (item: any) => 'Visualizar/' + item[this.model.primaryKey],
      icon: () => 'eye',
      tooltip: () => 'Ver detalle',
      click: () => {},
    });
  }
}
