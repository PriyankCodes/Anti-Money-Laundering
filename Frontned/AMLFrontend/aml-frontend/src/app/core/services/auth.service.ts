import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse, VerifyOtpRequest } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token here
      this.currentUserSubject.next({ token });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials, this.getHttpOptions())
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.success && response.token) {
            console.log('Storing token:', response.token);
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', credentials.email);
            
            // Store additional user info if available in response
            if (response.user) {
              // Store both userId and customerId if available
              if (response.user.userId) {
                localStorage.setItem('userId', response.user.userId.toString());
                console.log('Stored user ID:', response.user.userId);
              } else if (response.user.id) {
                localStorage.setItem('userId', response.user.id.toString());
                console.log('Stored user ID:', response.user.id);
              } else {
                // Try to extract userId from JWT token
                const userIdFromToken = this.extractUserIdFromToken(response.token);
                if (userIdFromToken) {
                  localStorage.setItem('userId', userIdFromToken.toString());
                  console.log('Extracted and stored userId from JWT token:', userIdFromToken);
                } else {
                  // If userId not in response or token, try to fetch user profile
                  console.warn('UserId not found in login response or token. Will attempt to fetch from profile.');
                }
              }
              
              // Store customerId separately for KYC operations
              if (response.user.customerId) {
                localStorage.setItem('customerId', response.user.customerId.toString());
                console.log('Stored customer ID:', response.user.customerId);
              }
              
              if (response.user.firstName) localStorage.setItem('firstName', response.user.firstName);
              if (response.user.lastName) localStorage.setItem('lastName', response.user.lastName);
              if (response.user.contactNumber) localStorage.setItem('contactNumber', response.user.contactNumber);
            } else {
              // No user object in response, try to fetch profile
              console.warn('No user object in login response. Will attempt to fetch from profile.');
            }
            
            this.currentUserSubject.next({ 
              token: response.token, 
              email: credentials.email,
              user: response.user 
            });
          }
        })
      );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success) {
            // Store user registration data for later use
            localStorage.setItem('email', registerData.email);
            localStorage.setItem('firstName', registerData.firstName);
            localStorage.setItem('lastName', registerData.lastName);
            localStorage.setItem('contactNumber', registerData.contactNumber);
          }
        })
      );
  }

  verifyOtp(otpData: VerifyOtpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/verify-otp`, otpData)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', response.email || '');
            localStorage.setItem('role', response.role || '');
            
            if (response.user) {
              if (response.user.userId) {
                localStorage.setItem('userId', response.user.userId.toString());
                console.log('Stored user ID from OTP:', response.user.userId);
              } else if (response.user.id) {
                localStorage.setItem('userId', response.user.id.toString());
                console.log('Stored user ID from OTP:', response.user.id);
              }
              
              if (response.user.customerId) {
                localStorage.setItem('customerId', response.user.customerId.toString());
                console.log('Stored customer ID from OTP:', response.user.customerId);
              }
            }
            
            this.currentUserSubject.next(response);
          }
        })
      );
  }

  resendOtp(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/resend-otp?email=${email}`, {});
  }

  logout(): void {
    // Clear all stored user data
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('contactNumber');
    
    // Clear current user subject
    this.currentUserSubject.next(null);
    
    console.log('AuthService: User logged out, all data cleared');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserIdFromToken(): number | null {
    const token = this.getToken();
    
    if (!token) {
      // Fallback to localStorage
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('customerId');
      return storedUserId ? parseInt(storedUserId) : null;
    }

    try {
      // Decode JWT token
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      // Extract user ID from token - try multiple possible field names
      const userId = decodedPayload.userId || 
                     decodedPayload.customerId || 
                     decodedPayload.id ||
                     decodedPayload.sub ||
                     decodedPayload.user_id ||
                     decodedPayload.customer_id ||
                     null;
      
      console.log('AuthService: Extracted user ID from token:', userId);
      
      // Store in localStorage for future use
      if (userId) {
        localStorage.setItem('userId', userId.toString());
        localStorage.setItem('customerId', userId.toString());
      }
      
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('AuthService: Error extracting user ID from token:', error);
      // Fallback to localStorage
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('customerId');
      return storedUserId ? parseInt(storedUserId) : null;
    }
  }

  getUserRoleFromToken(): string | null {
    const token = this.getToken();
    console.log('AuthService: Getting role from token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      // Fallback to localStorage
      const storedRole = localStorage.getItem('role');
      console.log('AuthService: No token, checking localStorage:', storedRole);
      return storedRole;
    }

    try {
      // Decode JWT token (split by '.' and decode the payload)
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      console.log('AuthService: Decoded token payload:', decodedPayload);
      
      // Extract role from token payload - try multiple possible field names
      let role = decodedPayload.role || 
                 decodedPayload.Role || 
                 decodedPayload.ROLE ||
                 decodedPayload.authorities?.[0] ||
                 decodedPayload.authority ||
                 decodedPayload.roles?.[0] ||
                 null;
      
      // If role is an object with authority field (Spring Security format)
      if (role && typeof role === 'object' && role.authority) {
        role = role.authority;
      }
      
      // Remove ROLE_ prefix if present (Spring Security convention)
      if (role && typeof role === 'string' && role.startsWith('ROLE_')) {
        role = role.substring(5);
      }
      
      console.log('AuthService: Extracted role from token:', role);
      
      // If no role in token, fallback to localStorage
      if (!role) {
        const storedRole = localStorage.getItem('role');
        console.log('AuthService: No role in token, using localStorage:', storedRole);
        return storedRole;
      }
      
      return role;
    } catch (error) {
      console.error('AuthService: Error decoding token:', error);
      // Fallback to localStorage on error
      const storedRole = localStorage.getItem('role');
      console.log('AuthService: Error decoding, using localStorage:', storedRole);
      return storedRole;
    }
  }

  forgotPassword(data: { email: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/forgot-password`, data, this.getHttpOptions());
  }

  resetPassword(data: { email: string; otp: string; newPassword: string; confirmPassword: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/reset-password`, data, this.getHttpOptions());
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT token payload:', payload);
      
      // Try different possible field names for userId in JWT
      const userId = payload.userId || payload.id || payload.sub || payload.user_id || payload.uid;
      
      if (userId) {
        console.log('Found userId in JWT token:', userId);
        return userId.toString();
      }
      
      console.warn('No userId found in JWT token payload');
      return null;
    } catch (error) {
      console.error('Error extracting userId from token:', error);
      return null;
    }
  }

  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }
}
