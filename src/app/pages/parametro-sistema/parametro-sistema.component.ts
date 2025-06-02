import { afterRenderEffect, Component, inject, Injector, OnInit, REQUEST, RESPONSE_INIT } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../components/table/table.component';
import { ControllerComponent } from '../../core/base/controller';
// import { AuthService } from '../../core/services/auth/auth.service';
import { ParametroSistemaService } from './parametro-sistema.service';

@Component({
  selector: 'app-parametro-sistema',
  standalone: true,
  templateUrl: './parametro-sistema.component.html',
  imports: [ReactiveFormsModule, TableComponent],
})
export class ParametroSistemaComponent extends ControllerComponent<ParametroSistemaService> implements OnInit {

  constructor(
    injector: Injector,
  ) {
    super(injector, ParametroSistemaService);

    const request = inject(REQUEST);
    console.log('Request:', request?.headers?.get('cookie'));

  }

  ngOnInit(): void {
    this.model.getAll(
      (data: any) => {
        console.log('Datos obtenidos:', data);
      }
    )

  }

  ngDoCheck(): void {
    
  }


}
