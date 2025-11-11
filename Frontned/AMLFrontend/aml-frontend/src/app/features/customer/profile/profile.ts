import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerProfileService, CustomerProfile, ProfileUpdateRequest, PasswordChangeRequest } from '../../../core/services/customer-profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  profile: CustomerProfile | null = null;
  loading: boolean = false;
  saving: boolean = false;
  
  // Form states
  isEditMode: boolean = false;
  showOTPModal: boolean = false;
  
  // Forms
  profileForm!: FormGroup;
  otpForm!: FormGroup;
  
  // OTP state
  otpSent: boolean = false;
  
  
  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private profileService: CustomerProfileService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  // Initialize reactive forms
  initializeForms(): void {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      dateOfBirth: ['', [Validators.required, this.futureDateValidator()]],
      nationality: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      country: ['', Validators.required]
    });

    this.otpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }


  // Load customer profile
  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.populateForm(profile);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile data';
        this.loading = false;
      }
    });
  }

  // Populate form with profile data
  populateForm(profile: CustomerProfile): void {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      contactNumber: profile.contactNumber,
      dateOfBirth: profile.dateOfBirth,
      nationality: profile.nationality,
      street: profile.street,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      country: profile.country
    });
  }

  // Toggle edit mode
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.profile) {
      // Reset form if canceling edit
      this.populateForm(this.profile);
      this.otpForm.reset();
      this.otpSent = false;
    }
    this.clearMessages();
  }

  // Save profile changes - automatically sends OTP first
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    // Automatically send OTP when user clicks save
    this.sendOTPAndShowModal();
  }

  // Send OTP and show modal for verification
  sendOTPAndShowModal(): void {
    if (!this.profile?.email) {
      this.errorMessage = 'Email not found. Please refresh the page.';
      return;
    }

    console.log('Sending OTP for profile update to:', this.profile.email);
    this.saving = true;
    this.clearMessages();
    
    this.profileService.sendOTP().subscribe({
      next: (response) => {
        console.log('OTP sent successfully:', response);
        this.saving = false;
        this.showOTPModal = true;
        this.successMessage = 'OTP sent to your email. Please enter the code to update your profile.';
      },
      error: (error: any) => {
        console.error('Error sending OTP:', error);
        this.errorMessage = error.error?.message || 'Failed to send OTP. Please try again.';
        this.saving = false;
      }
    });
  }

  // Actually update the profile after OTP verification
  updateProfileWithOTP(): void {
    const formValue = this.profileForm.value;
    const updateRequest: ProfileUpdateRequest = {
      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      street: formValue.street,
      city: formValue.city,
      state: formValue.state,
      pincode: formValue.pincode,
      contactNumber: formValue.contactNumber,
      nationality: formValue.nationality,
      otp: this.otpForm.value.otp,
      email: this.profile?.email || ''
    };

    this.saving = true;
    this.profileService.updateProfile(updateRequest).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.isEditMode = false;
        this.showOTPModal = false;
        this.successMessage = 'Profile updated successfully!';
        this.otpForm.reset();
        this.otpSent = false;
        this.saving = false;
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        this.saving = false;
      }
    });
  }

  // Send OTP for verification
  sendOTP(): void {
    if (!this.profile?.email) {
      this.errorMessage = 'Email not found. Please refresh the page.';
      return;
    }

    console.log('Sending OTP to email:', this.profile.email);
    this.saving = true;
    this.clearMessages();
    
    this.profileService.sendOTP().subscribe({
      next: (response) => {
        console.log('OTP sent successfully:', response);
        this.otpSent = true;
        this.successMessage = 'OTP sent to your email address. Please check your inbox.';
        this.saving = false;
      },
      error: (error: any) => {
        console.error('Error sending OTP:', error);
        console.error('Error details:', error.error);
        
        let errorMsg = 'Failed to send OTP. Please try again.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to server. Please check your connection.';
        } else if (error.status === 401) {
          errorMsg = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          errorMsg = 'Access denied. Please contact support.';
        }
        
        this.errorMessage = errorMsg;
        this.saving = false;
      }
    });
  }

  // Verify OTP and update profile
  verifyOTP(): void {
    if (this.otpForm.invalid) {
      this.markFormGroupTouched(this.otpForm);
      return;
    }

    // Update profile with the verified OTP
    this.updateProfileWithOTP();
  }


  // Utility methods
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeModals(): void {
    this.showOTPModal = false;
    this.clearMessages();
  }

  // Getters for form validation
  get f() { return this.profileForm.controls; }
  get of() { return this.otpForm.controls; }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': case 'VERIFIED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'INACTIVE': case 'SUSPENDED': case 'REJECTED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  // Custom validator for future date
  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate > today) {
        return { 'futureDate': true };
      }
      
      return null;
    };
  }

  // Get field error message for live validation
  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) {
        if (fieldName === 'pincode') return 'PIN code must be exactly 6 digits';
        if (fieldName === 'contactNumber') return 'Contact number must be 10-15 digits (with optional + prefix)';
        return `Invalid ${this.getFieldLabel(fieldName)} format`;
      }
      if (field.errors['futureDate']) return 'Date of birth cannot be in the future';
    }
    return '';
  }

  // Get OTP field error message
  getOtpError(): string {
    const field = this.otpForm.get('otp');
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return 'OTP is required';
      if (field.errors['pattern']) return 'OTP must be exactly 6 digits';
    }
    return '';
  }

  // Helper to get user-friendly field labels
  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      'firstName': 'First name',
      'lastName': 'Last name',
      'middleName': 'Middle name',
      'contactNumber': 'Contact number',
      'dateOfBirth': 'Date of birth',
      'nationality': 'Nationality',
      'street': 'Street',
      'city': 'City',
      'state': 'State',
      'pincode': 'PIN code',
      'country': 'Country'
    };
    return labels[fieldName] || fieldName;
  }

  // Get today's date in YYYY-MM-DD format for max date attribute
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
