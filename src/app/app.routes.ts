import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'Ingresar',
        pathMatch: 'full',
    },
    {
        path: 'Ingresar',
        loadComponent: () =>
            import('./pages/auth/login/login.component').then((m) => m.LoginComponent),

    },
    {
        path: 'parametro-sistema',
        loadComponent: () =>
            import('./pages/parametro-sistema/parametro-sistema.component').then((m) => m.ParametroSistemaComponent),
    },
];
