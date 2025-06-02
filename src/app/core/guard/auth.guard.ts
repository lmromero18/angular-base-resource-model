import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * authGuard es una función protectora de rutas (guardia) que verifica si un usuario tiene una sesión activa válida.
 * 
 * Esta implementación hace uso del nuevo enfoque funcional introducido en Angular 15+, eliminando la necesidad
 * de clases tradicionales e inyectando servicios directamente mediante `inject()`.
 * 
 * @returns `true` si el usuario está autenticado y su token es válido, o un `UrlTree` redirigiendo a `/Ingresar` si no lo está.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtiene el token de autenticación y verifica su validez
  const token = authService.getToken();

  console.log(token);
  

  const isValid = authService.isValid();

  return token && isValid ? true : router.parseUrl('/Ingresar');
};

