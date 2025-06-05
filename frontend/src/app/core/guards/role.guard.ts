// role.guard.ts
import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { environment } from "../../environments/environment";

export const roleGuard: CanActivateFn = (route, state) => {
  if (environment.disableGuards) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data?.["roles"] as string[];

  if (!requiredRoles || authService.hasRole(requiredRoles)) {
    return true;
  }

  router.navigate(["/"]);
  return false;
};
