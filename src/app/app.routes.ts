import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'parametro-sistema',
        loadComponent: () =>
            import('./pages/parametro-sistema/parametro-sistema.component').then((m) => m.ParametroSistemaComponent),

    },
];
