import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'Ingresar',
    pathMatch: 'full',
  },
  {
    path: 'Ingresar',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'parametro-sistema',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/parametro-sistema/parametro-sistema.component').then(
        (m) => m.ParametroSistemaComponent,
      ),
  },
  {
    path: 'carro',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/carro/table/carro-table.component').then(
            (m) => m.CarroTableComponent,
          ),
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('./pages/carro/form/carro-form.component').then(
            (m) => m.CarroFormComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/carro/form/carro-form.component').then(
            (m) => m.CarroFormComponent,
          ),
      },
    ],
  },
];
