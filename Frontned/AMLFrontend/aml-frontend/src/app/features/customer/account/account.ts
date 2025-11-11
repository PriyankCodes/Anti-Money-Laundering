import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Account as AccountModel } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit {
  accounts: AccountModel[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  selectedAccount: AccountModel | null = null;
  
  // View mode
  viewMode: 'grid' | 'table' = 'table';
  
  // Account creation form
  showCreateForm: boolean = false;
  isCreating: boolean = false;
  createForm = {
    accountType: '',
    currency: '',
    balance: 1000,
    nickname: ''
  };

  accountTypes = [
    { value: 'CURRENT', label: 'Current Account' },
    { value: 'SAVING', label: 'Savings Account' },
    { value: 'SALARY', label: 'Salary Account' }
  ];

  currencies = [
    { value: 'INR', label: 'Indian Rupee (INR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
    
  ];

  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    
    // Check for query parameters to open create account form
    this.route.queryParams.subscribe(params => {
      if (params['openModal'] === 'create') {
        setTimeout(() => {
          this.showCreateForm = true;
          console.log('Opened create account form from dashboard');
        }, 500); // Small delay to ensure data is loaded
      }
    });
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getCustomerAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.errorMessage = 'Unable to load accounts. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  selectAccount(account: AccountModel): void {
    this.selectedAccount = account;
  }

  closeDetails(): void {
    this.selectedAccount = null;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'CNY': '¥'
    };
    return symbols[currency] || currency;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'blocked': return 'status-blocked';
      default: return '';
    }
  }

  getTotalBalance(): number {
    return this.accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  getActiveAccountsCount(): number {
    return this.accounts.filter(acc => acc.status === 'ACTIVE').length;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  // Account creation methods
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.resetCreateForm();
    }
  }

  resetCreateForm(): void {
    this.createForm = {
      accountType: '',
      currency: '',
      balance: 1000,
      nickname: ''
    };
  }

  createAccount(): void {
    if (!this.createForm.accountType || !this.createForm.currency) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    const accountData = {
      accountType: this.createForm.accountType,
      currency: this.createForm.currency,
      balance: this.createForm.balance
    };

    this.dashboardService.createAccount(accountData).subscribe({
      next: (newAccount) => {
        this.accounts.unshift(newAccount);
        this.showCreateForm = false;
        this.resetCreateForm();
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating account:', error);
        
        // Handle KYC verification error
        if (error.status === 403 && error.error?.error === 'KYC Not Verified') {
          this.errorMessage = `
            <strong>KYC Verification Required</strong><br><br>
            ${error.error.message || 'You must have at least one verified KYC document before creating an account.'}<br><br>
            <a href="/customer/kyc" style="color: #007AFF; text-decoration: underline;">Go to KYC Page</a> to upload and verify your documents.
          `;
        } else {
          this.errorMessage = error.error?.message || 'Failed to create account. Please try again.';
        }
        
        this.isCreating = false;
      }
    });
  }
}
