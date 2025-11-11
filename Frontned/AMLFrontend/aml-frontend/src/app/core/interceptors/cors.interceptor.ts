import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add authorization header if token exists
    const token = this.authService.getToken();
    let authRequest = req;
    
    if (token) {
      authRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('AuthInterceptor: Added token to request:', req.url);
    } else {
      console.warn('AuthInterceptor: No token available for request:', req.url);
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('AuthInterceptor: HTTP Error:', {
          status: error.status,
          url: req.url,
          message: error.message,
          error: error.error
        });

        // Handle 401 Unauthorized - token expired or invalid
        if (error.status === 401) {
          console.error('AuthInterceptor: ❌ 401 Unauthorized');
          console.error('  URL:', req.url);
          console.error('  This will redirect to login in 2 seconds...');
          console.error('  Check if your backend endpoint requires authentication');
          
          // Delay redirect slightly to see the error
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }, 2000);
          
          return throwError(() => error);
        }
        
        // Handle 403 Forbidden - insufficient permissions
        if (error.status === 403) {
          console.error('AuthInterceptor: ❌ 403 Forbidden');
          console.error('  URL:', req.url);
          console.error('  You do not have permission to access this resource');
          alert('You do not have permission to access this resource.');
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }
}
