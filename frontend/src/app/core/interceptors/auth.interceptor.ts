import { HttpInterceptorFn } from "@angular/common/http"
import { inject } from "@angular/core"
import { AuthService } from "../services/auth.service"

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.getToken()

  if (token) {
    // Set token as cookie for SSE endpoints (since EventSource can't use custom headers)
    document.cookie = `auth_token=${token}; path=/; SameSite=Strict; Secure=${location.protocol === 'https:'}`;
    
    // Clone request with Authorization header for regular HTTP requests
    const authReq = req.clone({
      headers: req.headers.set("Authorization", `Bearer ${token}`),
    })
    
    return next(authReq)
  } else {
    // Clear auth cookie if no token
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  return next(req)
}