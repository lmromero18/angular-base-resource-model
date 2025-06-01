import { afterRenderEffect, Component, Injector, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../components/table/table.component';
import { ControllerComponent } from '../../core/base/controller';
import { AuthService } from '../../core/services/auth/auth.service';
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
    public authService: AuthService
  ) {
    super(injector, ParametroSistemaService);

    afterRenderEffect(() => {
      // ✅ Esto sí se ejecuta en SSR
      this.model.getAll().subscribe({
        next: (response: any) => {
          console.log('✅ Respuesta recibida:', response);
        },
        error: (err) => {
          console.error('❌ Error al obtener los datos:', err);
        },
      });
    });
  }

  ngOnInit(): void {

  }


}
