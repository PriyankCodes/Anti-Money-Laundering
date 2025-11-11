import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { CountryService } from '../../../core/services/country.service';
import { Country } from '../../../core/models/country.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['../login/login.css']
})
export class RegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  currentStep: number = 1;
  totalSteps: number = 3;
  showPassword: boolean = false;
  
  // For OTP verification
  otp: string = '';
  otpSent: boolean = false;

  // Country dropdown
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  countrySearchTerm: string = '';
  showCountryDropdown: boolean = false;
  selectedCountry: Country | null = null;

  registerData: RegisterRequest = {
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    contactNumber: '',
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCountries();
  }

  loadCountries(): void {
    this.countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KP', name: 'North Korea' },
    { code: 'KR', name: 'South Korea' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
    ];
    this.filteredCountries = this.countries;
  }

  get progressPercentage(): number {
    const totalFields = 12; // email, firstName, lastName, dob, contact, password, street, city, state, pincode, country, nationality
    let completedFields = 0;

    // Personal details fields (6 fields)
    if (this.registrationForm.get('email')?.valid) completedFields++;
    if (this.registrationForm.get('firstName')?.valid) completedFields++;
    if (this.registrationForm.get('lastName')?.valid) completedFields++;
    if (this.registrationForm.get('dateOfBirth')?.valid) completedFields++;
    if (this.registrationForm.get('contactNumber')?.valid) completedFields++;
    if (this.registrationForm.get('password')?.valid) completedFields++;

    // Address details fields (6 fields)
    if (this.registrationForm.get('street')?.valid) completedFields++;
    if (this.registrationForm.get('city')?.valid) completedFields++;
    if (this.registrationForm.get('state')?.valid) completedFields++;
    if (this.registrationForm.get('pincode')?.valid) completedFields++;
    if (this.registrationForm.get('country')?.valid) completedFields++;
    if (this.registrationForm.get('nationality')?.valid) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  get isPersonalDetailsValid(): boolean {
    return !!(this.registrationForm.get('email')?.valid &&
           this.registrationForm.get('firstName')?.valid &&
           this.registrationForm.get('lastName')?.valid &&
           this.registrationForm.get('dateOfBirth')?.valid &&
           this.registrationForm.get('contactNumber')?.valid &&
           this.registrationForm.get('password')?.valid);
  }

  get isAddressDetailsValid(): boolean {
    return !!(this.registrationForm.get('street')?.valid &&
           this.registrationForm.get('city')?.valid &&
           this.registrationForm.get('state')?.valid &&
           this.registrationForm.get('pincode')?.valid &&
           this.registrationForm.get('country')?.valid &&
           this.registrationForm.get('nationality')?.valid &&
           this.registrationForm.get('agreement')?.valid);
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.isPersonalDetailsValid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.isAddressDetailsValid) {
      // Submit registration when moving from step 2 to step 3
      this.submitRegistration();
    }
  }

  submitRegistration(): void {
    if (!this.registrationForm.valid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Map form data to RegisterRequest
    const formValue = this.registrationForm.value;
    this.registerData = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      middleName: formValue.middleName || '',
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      nationality: formValue.nationality,
      contactNumber: formValue.contactNumber,
      street: formValue.street || '',
      city: formValue.city,
      state: formValue.state,
      country: formValue.country,
      pincode: formValue.pincode
    };

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // OTP sent successfully, move to step 3
          this.otpSent = true;
          this.currentStep = 3;
        } else {
          this.errorMessage = response.message || 'Registration failed';
          this.scrollToTop();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        // Handle different types of errors
        if (error.error) {
          // Check if it's a validation error with field-specific messages
          if (error.error.errors && Array.isArray(error.error.errors)) {
            // Spring Boot validation errors format
            const errorMessages = error.error.errors.map((err: any) => 
              `${err.field}: ${err.defaultMessage || err.message}`
            ).join(', ');
            this.errorMessage = errorMessages;
          } else if (error.error.message) {
            // Standard error message
            this.errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            // Plain string error
            this.errorMessage = error.error;
          } else {
            // Generic error
            this.errorMessage = 'Registration failed. Please check your information and try again.';
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'An error occurred during registration';
        }
        
        this.scrollToTop();
      }
    });
  }

  sendOTP(): void {
    // Resend OTP
    this.submitRegistration();
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required, this.futureDateValidator()]],
      nationality: ['', [Validators.required]],
      contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator()
      ]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      agreement: [false, [Validators.requiredTrue]]
    });
  }

  // Country search and selection
  onCountrySearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.countrySearchTerm = input.value;
    this.showCountryDropdown = true;
    if (this.countrySearchTerm) {
      this.filteredCountries = this.countries.filter(country =>
        country.name.toLowerCase().startsWith(this.countrySearchTerm.toLowerCase()) ||
        country.code.toLowerCase().startsWith(this.countrySearchTerm.toLowerCase())
      );
    } else {
      this.filteredCountries = this.countries;
    }
  }

  selectCountry(country: Country): void {
    console.log('Country selected:', country);
    this.selectedCountry = country;
    this.countrySearchTerm = country.name;
    this.showCountryDropdown = false;
    // Set country code (ISO 2-char) in form
    this.registrationForm.patchValue({
      country: country.code,
      nationality: country.name // Auto-populate nationality
    });
    console.log('Form values after selection:', {
      country: this.registrationForm.get('country')?.value,
      nationality: this.registrationForm.get('nationality')?.value
    });
  }

  onCountryInputBlur(): void {
    // Delay to allow mousedown on dropdown item
    setTimeout(() => {
      this.showCountryDropdown = false;
    }, 300);
  }

  onCountryInputFocus(): void {
    this.showCountryDropdown = true;
    if (!this.countrySearchTerm) {
      this.filteredCountries = this.countries;
    }
  }

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

  onSubmit(): void {
    // This is called from step 3 - OTP verification
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit verification code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const verifyData = {
      email: this.registerData.email,
      otp: this.otp
    };

    this.authService.verifyOtp(verifyData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Navigate to login page after successful verification
          this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'true' }
          });
        } else {
          this.errorMessage = response.message || 'OTP verification failed';
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

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) {
        if (fieldName === 'pincode') return 'PIN code must be exactly 6 digits';
        return `Invalid ${fieldName} format`;
      }
      if (field.errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number, and special character';
      if (field.errors['futureDate']) return 'Date of birth cannot be in the future';
    }
    return '';
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}