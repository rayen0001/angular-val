import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { NotificationService } from './core/services/notification.service';

// Factory function to initialize the notification service
function initNotificationService(notificationService: NotificationService) {
  return () => {
    // This will be executed during app initialization
    return notificationService.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(MatSnackBarModule),
    
    // Register the notification service
    NotificationService,
    
    // Initialize the notification service during app startup
    {
      provide: APP_INITIALIZER,
      useFactory: initNotificationService,
      deps: [NotificationService],
      multi: true
    }
  ],
};