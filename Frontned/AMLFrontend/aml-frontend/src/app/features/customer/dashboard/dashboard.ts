import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { DashboardStats, Transaction, Alert, CustomerProfile } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-content.html',
  styleUrl: './dashboard-content.css',
})
export class Dashboard implements OnInit {
  activeTab: string = 'dashboard';
  userMenuOpen: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';

  // Dashboard data
  dashboardData: DashboardStats = {
    totalTransactions: 0,
    lastLogin: '',
    totalAccounts: 0,
    pendingTransactions: 0
  };

  recentTransactions: Transaction[] = [];
  recentAlerts: Alert[] = [];
  customerProfile: CustomerProfile | null = null;
  
  // Modal state
  showTransactionModal: boolean = false;
  selectedTransaction: Transaction | null = null;
  showDepositModal: boolean = false;
  showWithdrawModal: boolean = false;
  showCreateAccountModal: boolean = false;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading dashboard data...');
    console.log('JWT Token:', localStorage.getItem('token'));

    // Load data from API only - no fallback data
    Promise.all([
      this.dashboardService.getDashboardStats().toPromise(),
      this.dashboardService.getRecentTransactions(5).toPromise(),
      this.dashboardService.getRecentAlerts(5).toPromise(),
      this.dashboardService.getCustomerProfile().toPromise(),
      this.dashboardService.getCustomerAccounts().toPromise()
    ]).then(([stats, transactions, alerts, profile, accounts]) => {
      console.log('Dashboard Stats:', stats);
      console.log('Recent Transactions:', transactions);
      console.log('Recent Alerts:', alerts);
      console.log('Customer Profile:', profile);
      console.log('Customer Accounts:', accounts);

      this.dashboardData = stats || this.dashboardData;
      // Update total accounts count
      if (accounts) {
        this.dashboardData.totalAccounts = accounts.length;
      }
      this.recentTransactions = transactions || [];
      this.recentAlerts = alerts || [];
      this.customerProfile = profile || null;
      this.isLoading = false;
      
      console.log('Successfully loaded data from API');
      
      // Debug: Log transaction data structure
      if (this.recentTransactions.length > 0) {
        console.log('First transaction:', this.recentTransactions[0]);
        console.log('Transaction keys:', Object.keys(this.recentTransactions[0]));
      }
      
      // Log the display name being used
      console.log('Display Name:', this.getUserDisplayName());
    }).catch(error => {
      this.isLoading = false;
      this.errorMessage = 'Unable to load dashboard data. Please check the backend APIs.';
      console.error('API Error Details:', error);
      console.error('Error Status:', error.status);
      console.error('Error Message:', error.message);
    });
  }


  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('Active tab:', tab);
    
    // Navigate to different routes based on tab
    switch(tab) {
      case 'dashboard':
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'accounts':
        this.router.navigate(['/customer/accounts']);
        break;
      case 'kyc':
        this.router.navigate(['/customer/kyc']);
        break;
      case 'transactions':
        this.router.navigate(['/customer/transactions']);
        break;
      case 'alerts':
        this.router.navigate(['/customer/alerts']);
        break;
      case 'profile':
        this.router.navigate(['/customer/profile']);
        break;
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    const currencyCode = currency || 'USD';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  getRiskClass(risk: number): string {
    if (risk >= 95) return 'risk-100';
    if (risk >= 80) return 'risk-95';
    return 'risk-61';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'blocked': return 'blocked';
      case 'pending': return 'pending';
      case 'open': return 'open';
      case 'true positive': return 'positive';
      case 'false positive': return 'negative';
      case 'resolved': return 'resolved';
      default: return '';
    }
  }

  refreshDashboard(): void {
    this.errorMessage = '';
    this.loadDashboardData();
  }

  // Method to manually try loading API data
  loadApiData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔄 Manual API refresh triggered...');

    // Test each API individually to identify which ones are failing
    const apiCalls = [
      { name: 'Dashboard Stats', call: this.dashboardService.getDashboardStats().toPromise() },
      { name: 'Recent Transactions', call: this.dashboardService.getRecentTransactions(5).toPromise() },
      { name: 'Recent Alerts', call: this.dashboardService.getRecentAlerts(5).toPromise() },
      { name: 'Customer Profile', call: this.dashboardService.getCustomerProfile().toPromise() },
      { name: 'Customer Accounts', call: this.dashboardService.getCustomerAccounts().toPromise() }
    ];

    Promise.allSettled(apiCalls.map(api => api.call)).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ ${apiCalls[index].name}:`, result.value);
        } else {
          console.error(`❌ ${apiCalls[index].name} failed:`, result.reason);
        }
      });

      // Update data with successful responses
      if (results[0].status === 'fulfilled') this.dashboardData = (results[0].value as DashboardStats) || this.dashboardData;
      if (results[1].status === 'fulfilled') this.recentTransactions = (results[1].value as Transaction[]) || [];
      if (results[2].status === 'fulfilled') this.recentAlerts = (results[2].value as Alert[]) || [];
      if (results[3].status === 'fulfilled') this.customerProfile = (results[3].value as CustomerProfile) || null;
      if (results[4].status === 'fulfilled') {
        const accounts = results[4].value as any[];
        if (accounts) {
          this.dashboardData.totalAccounts = accounts.length;
        }
      }

      this.isLoading = false;
      
      const failedCalls = results.filter(r => r.status === 'rejected').length;
      if (failedCalls === 0) {
        console.log('✅ All APIs loaded successfully!');
        this.errorMessage = '';
      } else {
        this.errorMessage = `⚠️ ${failedCalls} out of 5 APIs failed. Check console for details.`;
      }
    });
  }

  getUserDisplayName(): string {
    // First try to get from API response
    if (this.customerProfile && this.customerProfile.firstName && this.customerProfile.lastName) {
      return `${this.customerProfile.firstName} ${this.customerProfile.lastName}`;
    }
    
    // Then try localStorage (from registration)
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // Better fallback - don't use email parsing, just show "Loading..."
    if (this.isLoading) {
      return 'Loading...';
    }
    
    // Final fallback
    const email = localStorage.getItem('email');
    return email ? email.split('@')[0] : 'User';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }
  
  // Modal methods
  openTransactionModal(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showTransactionModal = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
  
  closeTransactionModal(): void {
    this.showTransactionModal = false;
    this.selectedTransaction = null;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
  
  // Quick Action methods
  openDepositModal(): void {
    console.log('Navigating to transactions page with deposit modal...');
    // Navigate to transactions page and open deposit modal
    this.router.navigate(['/customer/transactions'], { 
      queryParams: { openModal: 'deposit' } 
    });
  }

  openWithdrawModal(): void {
    console.log('Navigating to transactions page with withdraw modal...');
    // Navigate to transactions page and open withdraw modal
    this.router.navigate(['/customer/transactions'], { 
      queryParams: { openModal: 'withdraw' } 
    });
  }

  openCreateAccountModal(): void {
    console.log('Navigating to accounts page with create account modal...');
    // Navigate to accounts page and open create account modal
    this.router.navigate(['/customer/accounts'], { 
      queryParams: { openModal: 'create' } 
    });
  }

  viewAllTransactions(): void {
    console.log('Navigating to all transactions...');
    this.router.navigate(['/customer/transactions']);
  }
  
  // Helper methods to safely access transaction fields
  getReceiverAccount(transaction: any): string {
    // Try all possible field names for receiver account number
    const account = transaction.receiverAccountNumber || 
                   transaction.counterpartyAccount || 
                   transaction.toAccount || 
                   transaction.receiver_account_number ||
                   transaction.counterparty_account ||
                   transaction.to_account ||
                   transaction.receiverAccount ||
                   transaction.beneficiaryAccount;
    
    // If no receiver account, show sender account for reference
    if (!account || account === null) {
      const senderAccount = transaction.senderAccountNumber || 
                           transaction.fromAccount || 
                           transaction.accountNumber;
      if (senderAccount) {
        return `From: ${senderAccount}`;
      }
      console.log('⚠️ Backend Issue: Both receiver and sender accounts are null in transaction:', transaction);
      return 'Not Available';
    }
    
    return account;
  }

  getReceiverName(transaction: any): string {
    const name = transaction.receiverName || 
                transaction.counterpartyName || 
                transaction.receiver || 
                transaction.receiver_name ||
                transaction.counterparty_name ||
                transaction.toName ||
                transaction.beneficiaryName ||
                transaction.beneficiary;
    
    if (!name || name === null) {
      // For transactions without receiver, show transaction type
      return transaction.transactionType || transaction.type || 'Unknown';
    }
    
    return name;
  }

  getCountry(transaction: any): string {
    const country = transaction.country || 
                   transaction.countryCode || 
                   transaction.country_code ||
                   transaction.receiverCountry ||
                   transaction.receiver_country ||
                   transaction.destinationCountry;
    
    return country || '-';
  }

  getTransactionDate(transaction: any): string {
    return transaction.transactionDate || 
           transaction.date || 
           transaction.timestamp || 
           transaction.createdAt ||
           transaction.created_at ||
           '';
  }

  getTransactionDescription(transaction: any): string {
    return transaction.description || 
           transaction.transactionType || 
           transaction.type ||
           '-';
  }

  isCredit(transaction: any): boolean {
    return transaction.transactionType === 'CREDIT' || transaction.type === 'CREDIT';
  }

  isDebit(transaction: any): boolean {
    return transaction.transactionType === 'DEBIT' || transaction.type === 'DEBIT';
  }
  
  // TrackBy functions for better performance
  trackByTransactionId(index: number, transaction: Transaction): any {
    return transaction.id || index;
  }
  
  trackByAlertId(index: number, alert: Alert): any {
    return alert.id || index;
  }
}
