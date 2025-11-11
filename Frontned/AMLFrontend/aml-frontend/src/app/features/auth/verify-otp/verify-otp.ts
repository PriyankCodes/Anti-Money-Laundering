import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VerifyOtpRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-verify-otp',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
})
export class VerifyOtp implements OnInit {
  userEmail: string = '';
  verificationCode: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get email from query parameters
    this.route.queryParams.subscribe(params => {
      this.userEmail = params['email'] || '';
    });
  }

  onVerify(): void {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit verification code';
      this.scrollToTop();
      return;
    }

    if (!this.userEmail) {
      this.errorMessage = 'Email not found. Please try registering again.';
      this.scrollToTop();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const otpData: VerifyOtpRequest = {
      email: this.userEmail,
      otp: this.verificationCode
    };

    this.authService.verifyOtp(otpData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Verification successful! Redirecting to dashboard...';
          setTimeout(() => {
            // Extract role from JWT token
            const role = this.authService.getUserRoleFromToken();
            if (role) {
              localStorage.setItem('role', role);
              this.navigateBasedOnRole(role);
            } else {
              // Fallback to customer dashboard
              this.navigateBasedOnRole('CUSTOMER');
            }
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Verification failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An error occurred during verification';
        console.error('OTP verification error:', error);
        this.scrollToTop();
      }
    });
  }

  resendCode(): void {
    if (!this.userEmail) {
      this.errorMessage = 'Email not found. Please try registering again.';
      this.scrollToTop();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOtp(this.userEmail).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Verification code sent successfully!';
        } else {
          this.errorMessage = response.message || 'Failed to resend code';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An error occurred while resending code';
        console.error('Resend OTP error:', error);
        this.scrollToTop();
      }
    });
  }

  // Auto-format code input (optional enhancement)
  onCodeInput(event: any): void {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    this.verificationCode = value.substring(0, 6); // Limit to 6 digits
    this.errorMessage = ''; // Clear error on input
  }

  private navigateBasedOnRole(role: string): void {
    // Normalize role to uppercase for comparison
    const normalizedRole = role.toUpperCase();
    
    switch (normalizedRole) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'COMPLIANCE_OFFICER':
      case 'OFFICER':
        this.router.navigate(['/compliance/dashboard']);
        break;
      case 'CUSTOMER':
      case 'USER':
        this.router.navigate(['/dashboard']);
        break;
      default:
        console.warn('Unknown role:', role, '- redirecting to customer dashboard');
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
