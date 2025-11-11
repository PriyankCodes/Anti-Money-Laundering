import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('AuthGuard: Checking access...');
    const token = this.authService.getToken();
    
    if (!token) {
      console.log('AuthGuard: No token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    console.log('AuthGuard: Token found:', token.substring(0, 20) + '...');

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('AuthGuard: Token expired, redirecting to login');
      this.authService.logout(); // Clear expired token
      this.router.navigate(['/auth/login']);
      return false;
    }

    console.log('AuthGuard: Token valid, allowing access');
    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      
      // Add 5 minute buffer to prevent premature expiration
      const bufferTime = 5 * 60; // 5 minutes in seconds
      const isExpired = (expirationTime - bufferTime) < currentTime;
      
      console.log('AuthGuard: Token expiration check:');
      console.log('  Current time:', currentTime, new Date(currentTime * 1000));
      console.log('  Token expires:', expirationTime, new Date(expirationTime * 1000));
      console.log('  With buffer:', expirationTime - bufferTime, new Date((expirationTime - bufferTime) * 1000));
      console.log('  Is expired:', isExpired);
      
      return isExpired;
    } catch (error) {
      console.error('AuthGuard: Error parsing token:', error);
      return true; // Treat invalid tokens as expired
    }
  }
}
