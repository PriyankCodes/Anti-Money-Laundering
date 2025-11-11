import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerProfileService } from '../../../core/services/customer-profile.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  link?: string;
}

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, FormsModule, ToastComponent, ConfirmationDialogComponent],
  providers: [],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.css',
})
export class CustomerLayout implements OnInit {
  currentRoute: string = '';
  showNotifications: boolean = false;
  showUserMenu: boolean = false;
  showChangePasswordModal: boolean = false;
  
  notifications: Notification[] = [];

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private apiUrl = environment.apiUrl;

  displayName: string = 'Customer';

  constructor(
    private router: Router,
    private toastService: ToastService,
    private http: HttpClient,
    private profileService: CustomerProfileService
  ) {}

  ngOnInit(): void {
    // Track route changes for dynamic title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this.router.url;
    });
    
    this.currentRoute = this.router.url;
    
    // Load user profile name
    this.loadUserName();
    
    // Load notifications from system data
    this.loadNotifications();
  }

  loadUserName(): void {
    // First check localStorage
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    if (firstName && lastName) {
      this.displayName = `${firstName} ${lastName}`;
      return;
    }

    // If not in localStorage, fetch from profile API
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile.firstName && profile.lastName) {
          this.displayName = `${profile.firstName} ${profile.lastName}`;
          // Store in localStorage for future use
          localStorage.setItem('firstName', profile.firstName);
          localStorage.setItem('lastName', profile.lastName);
        }
      },
      error: (error) => {
        console.error('Error loading profile name:', error);
        // Fallback to email if profile fetch fails
        const email = localStorage.getItem('email');
        if (email) {
          this.displayName = email.split('@')[0];
        }
      }
    });
  }

  loadNotifications(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Generate notifications from customer-specific data
    this.generateCustomerNotifications(headers);
  }

  private generateCustomerNotifications(headers: HttpHeaders): void {
    const customerId = localStorage.getItem('userId');
    
    // Generate notifications from pending KYC documents
    this.http.get<any[]>(`${this.apiUrl}/kyc/customer/${customerId}`, { headers })
      .subscribe({
        next: (docs) => {
          const pending = docs.filter(d => d.status === 'PENDING');
          if (pending.length > 0) {
            this.notifications.push({
              id: Date.now(),
              title: 'KYC Documents Pending',
              message: `${pending.length} documents awaiting verification`,
              time: 'Just now',
              type: 'warning',
              read: false,
              link: '/customer/kyc'
            });
          }
        },
        error: () => {}
      });

    // Generate notifications from customer alerts
    this.http.get<any>(`${this.apiUrl}/customers/alerts`, { headers })
      .subscribe({
        next: (response) => {
          // Handle ApiResponseDto wrapper
          const alerts = response.data || response;
          const unresolved = alerts.filter((a: any) => a.status === 'PENDING' || a.status === 'NEW');
          if (unresolved.length > 0) {
            this.notifications.push({
              id: Date.now() + 1,
              title: 'Transaction Alerts',
              message: `${unresolved.length} alerts require your attention`,
              time: 'Recent',
              type: 'info',
              read: false,
              link: '/customer/alerts'
            });
          }
        },
        error: () => {}
      });
  }

  private formatNotificationTime(timestamp: string): string {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return time.toLocaleDateString();
  }

  get unreadNotifications(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getPageTitle(): string {
    const route = this.currentRoute;
    if (route.includes('/dashboard')) return 'Dashboard';
    if (route.includes('/accounts')) return 'My Accounts';
    if (route.includes('/transactions')) return 'Transactions';
    if (route.includes('/alerts')) return 'Alerts';
    if (route.includes('/kyc')) return 'KYC Documents';
    if (route.includes('/profile')) return 'Profile';
    return 'Customer Portal';
  }

  getUserName(): string {
    return this.displayName;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  handleNotificationClick(notification: Notification): void {
    notification.read = true;
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
    this.showNotifications = false;
  }

  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.showUserMenu = false;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  changePassword(): void {
    // Validation
    if (!this.passwordData.currentPassword) {
      this.toastService.error('Current password is required!');
      return;
    }

    if (!this.passwordData.newPassword) {
      this.toastService.error('New password is required!');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.error('New passwords do not match!');
      return;
    }

    if (this.passwordData.newPassword.length < 8) {
      this.toastService.error('Password must be at least 8 characters long!');
      return;
    }

    // API call to change password
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.toastService.error('Session expired. Please login again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Backend uses JWT token to identify user, so we don't need to send email/userId
    // Just send the password fields
    const payload = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword,
      confirmPassword: this.passwordData.confirmPassword
    };

    console.log('Changing password...');
    
    this.http.post(`${this.apiUrl}/auth/change-password`, payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Password change successful:', response);
          this.toastService.success(response.message || 'Password changed successfully!');
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error('Password change error:', error);
          
          let errorMessage = 'Failed to change password.';
          
          if (error.status === 401) {
            errorMessage = 'Current password is incorrect or session expired. Please try again.';
          } else if (error.status === 404 || error.status === 500) {
            if (error.error?.message && error.error.message.includes('User not found')) {
              errorMessage = 'Unable to verify user identity. Please contact support or try logging out and back in.';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            }
          } else if (error.status === 400) {
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.errors) {
              const errors = error.error.errors;
              errorMessage = Object.values(errors).join(', ');
            } else {
              errorMessage = 'Invalid password format. Please check your input.';
            }
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          }
          
          this.toastService.error(errorMessage);
        }
      });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}
