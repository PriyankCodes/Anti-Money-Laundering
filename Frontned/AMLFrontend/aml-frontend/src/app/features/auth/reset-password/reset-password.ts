import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login-new.css']
})
export class ResetPassword implements OnInit {
  resetForm!: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Get email from query params
    this.route.queryParams.subscribe(params => {
      const email = params['email'] || '';
      this.resetForm.patchValue({ email });
    });
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator() });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'Please fix all validation errors';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const resetData = this.resetForm.value;

    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Password reset successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Reset password error:', error);
        this.errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }

  // Custom password strength validator
  private passwordValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;
      if (!value) return null;

      const hasNumber = /[0-9]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[@#$%^&+=]/.test(value);

      const valid = hasNumber && hasUpper && hasLower && hasSpecial;
      return valid ? null : { 'passwordStrength': true };
    };
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): {[key: string]: any} | null => {
      const password = group.get('newPassword')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      
      if (!password || !confirmPassword) return null;
      
      return password === confirmPassword ? null : { 'passwordMismatch': true };
    };
  }

  // Get field error message for live validation
  getFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) {
        if (fieldName === 'otp') return 'OTP must be exactly 6 digits';
        return `Invalid ${this.getFieldLabel(fieldName)} format`;
      }
      if (field.errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number, and special character (@#$%^&+=)';
    }
    
    // Check for password mismatch at form level
    if (fieldName === 'confirmPassword' && field?.touched) {
      if (this.resetForm.errors?.['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    
    return '';
  }

  // Helper to get user-friendly field labels
  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      'email': 'Email',
      'otp': 'OTP',
      'newPassword': 'New password',
      'confirmPassword': 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }
}
