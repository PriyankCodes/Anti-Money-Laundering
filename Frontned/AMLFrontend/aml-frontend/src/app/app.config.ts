import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, Shield, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-angular';
import { AuthInterceptor } from './core/interceptors/cors.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // Register icons globally
    importProvidersFrom(
      LucideAngularModule.pick({
        Shield,
        Mail,
        Lock,
        Eye,
        EyeOff,
        Sun,
        Moon
      })
    ),
  ],
};
