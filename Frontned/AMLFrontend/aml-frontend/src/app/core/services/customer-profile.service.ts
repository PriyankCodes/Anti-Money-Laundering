import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CustomerProfile {
  customerId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  nationality: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLogin?: string;
  emailVerified: boolean;
}

export interface ProfileUpdateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  nationality: string;
  otp: string;
  email: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerProfileService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get customer profile
  getProfile(): Observable<CustomerProfile> {
    return this.http.get<any>(`${this.API_URL}/customers/profile`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const profile = response.data || response;
        return this.mapToProfile(profile);
      })
    );
  }

  // Update customer profile
  updateProfile(profileData: ProfileUpdateRequest): Observable<CustomerProfile> {
    return this.http.put<any>(`${this.API_URL}/customers/profile`, profileData, this.getHttpOptions()).pipe(
      map((response: any) => {
        const profile = response.data || response;
        return this.mapToProfile(profile);
      })
    );
  }

  // Send OTP for profile update verification
  sendOTP(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/customers/profile/send-otp`, {}, this.getHttpOptions());
  }

  // Helper method to map API response to CustomerProfile interface
  private mapToProfile(data: any): CustomerProfile {
    return {
      customerId: data.customerId || data.id,
      firstName: data.firstName || '',
      middleName: data.middleName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      contactNumber: data.contactNumber || data.phoneNumber || '',
      dateOfBirth: data.dateOfBirth || '',
      nationality: data.nationality || '',
      street: data.street || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pincode: data.pincode || data.zipCode || '',
      kycStatus: data.kycStatus || 'PENDING',
      status: data.status || 'ACTIVE',
      createdAt: data.createdAt || '',
      lastLogin: data.lastLogin || '',
      emailVerified: data.emailVerified || false
    };
  }

  // Helper methods
  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }
}
