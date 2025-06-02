import { afterRenderEffect, Component, inject, Injector, OnInit, REQUEST, RESPONSE_INIT } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../components/table/table.component';
import { ControllerComponent } from '../../core/base/controller';
// import { AuthService } from '../../core/services/auth/auth.service';
import { ParametroSistemaService } from './parametro-sistema.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-parametro-sistema',
  standalone: true,
  templateUrl: './parametro-sistema.component.html',
  imports: [ReactiveFormsModule, TableComponent],
})
export class ParametroSistemaComponent extends ControllerComponent<ParametroSistemaService> implements OnInit {

  constructor(
    injector: Injector,
    public authService: AuthService
  ) {
    super(injector, ParametroSistemaService);
  }

  ngOnInit(): void {
    console.log(`[${new Date().toISOString()}] Iniciando petición de oficinas...`);
    this.model.where('tx_oficina', '=', 'Sociedad de Corretaje Bicentenaria').getAll(
      (data: any) => {
        console.log(`[${new Date().toISOString()}] Respuesta de oficinas recibida`, data);
      }
    );

    console.log(`[${new Date().toISOString()}] Iniciando petición de participantes...`);
    this.model.new().from('v1/st_participante').getAll(
      (data: any) => {
        console.log(`[${new Date().toISOString()}] Respuesta de participantes recibida`, data);
      }
    );
  }


  ngDoCheck(): void {

  }


}
