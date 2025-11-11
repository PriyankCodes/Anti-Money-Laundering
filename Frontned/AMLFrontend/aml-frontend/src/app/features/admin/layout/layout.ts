import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, FormsModule, ToastComponent, ConfirmationDialogComponent],
  providers: [],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout implements OnInit {
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

  constructor(
    private router: Router,
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Track route changes for dynamic title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this.router.url;
    });
    
    this.currentRoute = this.router.url;
    
    // Load notifications from system data
    this.loadNotifications();
  }

  loadNotifications(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Generate notifications from system data
    this.generateFallbackNotifications(headers);
  }

  private generateFallbackNotifications(headers: HttpHeaders): void {
    // Generate notifications from KYC pending documents
    this.http.get<any[]>(`${this.apiUrl}/admin/kyc/pending`, { headers })
      .subscribe({
        next: (docs) => {
          if (docs && docs.length > 0) {
            this.notifications.push({
              id: Date.now(),
              title: 'KYC Documents Pending',
              message: `${docs.length} documents awaiting review`,
              time: 'Just now',
              type: 'info',
              read: false,
              link: '/admin/kyc-review'
            });
          }
        },
        error: () => {}
      });

    // Generate notifications from pending alerts
    this.http.get<any[]>(`${this.apiUrl}/compliance/alerts`, { headers })
      .subscribe({
        next: (alerts) => {
          const pending = alerts.filter(a => a.status === 'PENDING' || a.status === 'NEW');
          if (pending.length > 0) {
            this.notifications.push({
              id: Date.now() + 1,
              title: 'Pending Alerts',
              message: `${pending.length} alerts require attention`,
              time: 'Recent',
              type: 'warning',
              read: false
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
    if (route.includes('/users')) return 'User Management';
    if (route.includes('/kyc-review')) return 'KYC Review';
    if (route.includes('/rules')) return 'Rule Management';
    if (route.includes('/keywords')) return 'Suspicious Keywords';
    if (route.includes('/countries')) return 'Risky Countries';
    if (route.includes('/audit-logs')) return 'Audit Logs';
    if (route.includes('/reports')) return 'Reports & Analytics';
    return 'Admin Panel';
  }

  getUserName(): string {
    const email = localStorage.getItem('email');
    if (email) {
      return email.split('@')[0];
    }
    return 'Admin';
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

    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    
    if (!email) {
      this.toastService.error('User email not found. Please login again.');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // Build payload - email is the primary identifier
    const payload: any = {
      email: email,
      oldPassword: this.passwordData.currentPassword,
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword,
      confirmPassword: this.passwordData.confirmPassword
    };
    
    // Add userId if available (but email should be sufficient)
    if (userId && userId !== 'null') {
      payload.userId = parseInt(userId);
      payload.id = parseInt(userId);
    }
    
    // Add role to help backend route to correct user table
    if (role && role !== 'null') {
      payload.role = role;
    }

    console.log('Changing password for user:', email, 'userId:', userId, 'role:', role);
    
    // If userId is null, warn but continue with email
    if (!userId || userId === 'null') {
      console.warn('UserId not found in localStorage. Backend should identify user by email:', email);
    }
    
    this.http.post(`${this.apiUrl}/auth/change-password`, payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Password change successful:', response);
          this.toastService.success(response.message || 'Password changed successfully!');
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error('Password change error:', error);
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
          console.error('Full error object:', JSON.stringify(error.error, null, 2));
          
          let errorMessage = 'Failed to change password.';
          
          if (error.status === 401) {
            errorMessage = 'Current password is incorrect or session expired. Please try again.';
          } else if (error.status === 404 || error.status === 500) {
            // 404 or 500 with "User not found" message
            if (error.error?.message && error.error.message.includes('User not found')) {
              errorMessage = 'Unable to verify user identity. The backend requires userId which is missing. Please contact support or try logging out and back in.';
              console.error('User identification issue - userId:', localStorage.getItem('userId'), 'email:', localStorage.getItem('email'));
              console.error('Backend error:', error.error.message);
            } else if (error.error?.message) {
              errorMessage = error.error.message;
              console.error('Backend returned:', error.error.message);
            } else if (error.error?.error) {
              errorMessage = error.error.error;
              console.error('Backend error field:', error.error.error);
            }
          } else if (error.status === 400) {
            // Bad request - validation error
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.errors) {
              // Spring validation errors
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
