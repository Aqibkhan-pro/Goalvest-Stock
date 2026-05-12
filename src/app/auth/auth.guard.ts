import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(Auth);
  const router = inject(Router);

  const user = await firstValueFrom(authState(auth));
  if (user) return true;

  router.navigate(['/login']);
  return false;
};
