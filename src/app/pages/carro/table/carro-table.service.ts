import { Injectable } from '@angular/core';
import { Attribute } from '../../../core/models/attribute.model';
import { BaseResourceService } from '../../../core/services/base/base-resource.service';

@Injectable({
  providedIn: 'root',
})
export class CarroTableService extends BaseResourceService {
  override name = 'Carro';
  override endpoint = 'carro';
  override primaryKey = 'id';

  override permissions: Record<string, string | boolean> = {
    create: '',
    read: '',
    update: '',
    delete: '',
  };

  public override boot() {
    this.canCreate = () => true;
    this.canDelete = () => true;
    this.canRead = () => true;
    this.canUpdate = () => true;
  }

  override attributes: Attribute[] = [
    new Attribute({
      name: 'id',
      label: 'ID',
    }),
    new Attribute({
      name: 'nb_marca',
      label: 'Marca',
    }),
    new Attribute({
      name: 'nb_modelo',
      label: 'Modelo',
    }),
    new Attribute({
      name: 'nu_anio',
      label: 'Año',
    }),
    new Attribute({
      name: 'mo_monto',
      label: 'Monto',
    }),
    new Attribute({
      name: 'is_disponible',
      label: 'Disponible',
    }),
  ];
}
