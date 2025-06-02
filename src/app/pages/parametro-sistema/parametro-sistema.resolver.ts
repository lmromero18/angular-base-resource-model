import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ParametroSistemaService } from './parametro-sistema.service';

export const ParametroSistemaResolver: ResolveFn<any> = () => {
  const service = inject(ParametroSistemaService);

  return service.getAll();
};
