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
    loadComponent: () =>
      import('./pages/posts/posts.component').then((m) => m.PostsComponent),
  },
];
