import { Component, Injector, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../../components/table/table.component';
import { ControllerComponent } from '../../../core/base/controller';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ICarro } from '../carro.types';
import { CarroTableService } from './carro-table.service';

@Component({
  selector: 'app-carro',
  templateUrl: './carro-table.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TableComponent],
})
export class CarroTableComponent
  extends ControllerComponent<CarroTableService>
  implements OnInit
{
  constructor(
    injector: Injector,
    public authService: AuthService,
  ) {
    super(injector, CarroTableService);
  }

  ngOnInit(): void {
    this.model.addAction('ver_detalle', {
      can: () => true,
      disable: (item: any) => false,
      class: () => 'btn text-dark-300',
      link: (item: any) => 'Visualizar/' + item[this.model.primaryKey],
      icon: () => 'eye',
      tooltip: () => 'Ver detalle',
    });
    this.fetchData();
  }

  fetchData(): void {
    this.model.getAll((carros: ICarro[]) => {
      console.log(carros);
    });
  }

  logOut(): void {
    this.authService.logout();
  }

  refreshSession(): void {
    this.authService.refresh();
  }

  ngDoCheck(): void {}
}
