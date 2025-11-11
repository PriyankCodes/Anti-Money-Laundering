import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {

  constructor() {}

  getToken(): string | null {
    // Try multiple token storage locations in order of preference
    const tokenSources = [
      () => localStorage.getItem('token'),
      () => localStorage.getItem('authToken'),
      () => localStorage.getItem('jwt'),
      () => localStorage.getItem('access_token'),
      () => sessionStorage.getItem('token'),
      () => sessionStorage.getItem('authToken'),
      () => sessionStorage.getItem('jwt'),
      () => sessionStorage.getItem('access_token')
    ];

    for (const getTokenFn of tokenSources) {
      const token = getTokenFn();
      if (token && token.trim() !== '') {
        return token;
      }
    }

    return null;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return headers;
  }

  getHttpOptions() {
    return {
      headers: this.getAuthHeaders(),
      withCredentials: true
    };
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token.trim() !== '';
  }

  // Debug method to check all storage locations
  debugTokenStorage(): void {
    console.log('=== Token Storage Debug ===');
    console.log('localStorage.token:', localStorage.getItem('token'));
    console.log('localStorage.authToken:', localStorage.getItem('authToken'));
    console.log('localStorage.jwt:', localStorage.getItem('jwt'));
    console.log('localStorage.access_token:', localStorage.getItem('access_token'));
    console.log('sessionStorage.token:', sessionStorage.getItem('token'));
    console.log('sessionStorage.authToken:', sessionStorage.getItem('authToken'));
    console.log('sessionStorage.jwt:', sessionStorage.getItem('jwt'));
    console.log('sessionStorage.access_token:', sessionStorage.getItem('access_token'));
    console.log('=== End Debug ===');
  }
}
