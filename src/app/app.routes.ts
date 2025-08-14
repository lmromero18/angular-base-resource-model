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
      import('./pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'parametro-sistema',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/parametro-sistema/parametro-sistema.component').then(
        (m) => m.ParametroSistemaComponent
      ),
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/posts/table/posts-table.component').then(
            (m) => m.PostsTableComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/posts/form/posts-form.component').then(
            (m) => m.PostsFormComponent
          ),
      },
    ],
  },
];
