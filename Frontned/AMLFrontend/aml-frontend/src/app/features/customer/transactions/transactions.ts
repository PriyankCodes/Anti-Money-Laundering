import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyService, CurrencyConversion } from '../../../core/services/currency.service';
import { Transaction, Account } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  // Make Math available in template
  Math = Math;
  
  // Transaction form
  transactionForm = {
    senderAccountNumber: '',
    receiverAccountNumber: '',
    amount: 0,
    description: ''
  };

  // Currency conversion
  supportedCurrencies: string[] = [];
  showCurrencyCalculator: boolean = false;
  currencyCalculator = {
    fromCurrency: 'INR',
    toCurrency: 'USD',
    amount: 0
  };
  conversionResult: CurrencyConversion | null = null;
  isConverting: boolean = false;
  convertedAmountDisplay: string = '';

  // Data
  accounts: Account[] = [];
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  // UI State
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedTransaction: Transaction | null = null;

  // Filters
  searchTerm: string = '';
  selectedStatus: string = 'All';
  selectedDateFilter: string = 'Date (Newest)';
  selectedTransactionType: string = 'All';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginatedTransactions: Transaction[] = [];
  
  // Download modal
  showDownloadModal: boolean = false;
  downloadStartDate: string = '';
  downloadEndDate: string = '';
  downloadDateError: string = '';
  
  // Form tabs
  activeFormTab: string = 'transfer';
  
  // Additional forms
  depositForm = {
    accountNumber: '',
    amount: 0,
    source: ''
  };
  
  withdrawalForm = {
    accountNumber: '',
    amount: 0,
    purpose: ''
  };

  constructor(
    private transactionService: TransactionService,
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastService: ToastService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadSupportedCurrencies();
    
    // Check for query parameters to open specific modals
    this.route.queryParams.subscribe(params => {
      if (params['openModal']) {
        setTimeout(() => {
          if (params['openModal'] === 'deposit') {
            this.setFormTab('deposit');
            console.log('Opened deposit form from dashboard');
          } else if (params['openModal'] === 'withdraw') {
            this.setFormTab('withdrawal');
            console.log('Opened withdrawal form from dashboard');
          }
        }, 500); // Small delay to ensure data is loaded
      }
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load accounts
    this.dashboardService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        
        // Check if user has no accounts
        if (accounts.length === 0) {
          this.errorMessage = `
            <strong>No Accounts Found</strong><br><br>
            You need to create an account before you can make transactions.<br><br>
            <strong>Note:</strong> You must have at least one verified KYC document to create an account.<br><br>
            <a href="/customer/kyc" style="color: #007AFF; text-decoration: underline;">Verify KYC Documents</a> | 
            <a href="/customer/account" style="color: #007AFF; text-decoration: underline;">Create Account</a>
          `;
          this.isLoading = false;
          return;
        }
        
        if (accounts.length > 0) {
          this.transactionForm.senderAccountNumber = accounts[0].accountNumber;
          this.depositForm.accountNumber = accounts[0].accountNumber;
          this.withdrawalForm.accountNumber = accounts[0].accountNumber;
        }
        
        // Load transactions only if accounts exist
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        
        // Handle KYC verification error
        if (error.status === 403 && error.error?.error === 'KYC Not Verified') {
          this.errorMessage = `
            <strong>KYC Verification Required</strong><br><br>
            ${error.error.message || 'You must verify your KYC documents before accessing accounts.'}<br><br>
            <a href="/customer/kyc" style="color: #007AFF; text-decoration: underline;">Go to KYC Page</a> to upload and verify your documents.
          `;
        } else {
          this.errorMessage = 'Unable to load accounts. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }

  loadTransactions(): void {
    // Use DashboardService.getAllTransactions() - same endpoint as dashboard
    // This returns complete transaction data with all fields populated
    this.dashboardService.getAllTransactions().subscribe({
      next: (response: any) => {
        this.transactions = response.content || [];
        this.filteredTransactions = [...this.transactions];
        this.isLoading = false;
        
        // Debug: Log the first transaction to see the actual data structure
        if (this.transactions.length > 0) {
          console.log('=== CUSTOMER TRANSACTION DATA ===');
          console.log('Total transactions:', this.transactions.length);
          console.log('First transaction:', this.transactions[0]);
          console.log('Available keys:', Object.keys(this.transactions[0]));
          console.log('============================');
        }
        
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Unable to load transactions. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  submitTransaction(): void {
    // Validation
    if (!this.transactionForm.senderAccountNumber || 
        !this.transactionForm.receiverAccountNumber || 
        !this.transactionForm.amount) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    if (this.transactionForm.amount <= 0) {
      this.toastService.error('Amount must be greater than 0');
      return;
    }

    // Check if sender and receiver accounts are the same
    if (this.transactionForm.senderAccountNumber === this.transactionForm.receiverAccountNumber) {
      this.toastService.error('Sender and receiver accounts cannot be the same');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const transactionData = {
      senderAccountNumber: this.transactionForm.senderAccountNumber,
      receiverAccountNumber: this.transactionForm.receiverAccountNumber,
      amount: this.transactionForm.amount,
      description: this.transactionForm.description
    };

    this.transactionService.createTransaction(transactionData).subscribe({
      next: (newTransaction) => {
        this.toastService.success('Transaction submitted successfully!');
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating transaction:', error);
        this.toastService.error(error.error?.message || 'Failed to submit transaction. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.transactionForm = {
      senderAccountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      receiverAccountNumber: '',
      amount: 0,
      description: ''
    };
  }

  applyFilters(): void {
    let filtered = [...this.transactions];

    // Transaction type filter
    if (this.selectedTransactionType !== 'All') {
      filtered = filtered.filter(transaction => {
        const type = this.getTransactionTypeFromData(transaction);
        
        if (this.selectedTransactionType === 'CREDIT') {
          return type === 'credit';
        } else if (this.selectedTransactionType === 'DEBIT') {
          return type === 'debit';
        } else if (this.selectedTransactionType === 'TRANSFER') {
          return type === 'transfer';
        }
        
        return true;
      });
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (this.getSenderAccount(t).toLowerCase().includes(term)) ||
        (this.getReceiverAccount(t).toLowerCase().includes(term)) ||
        (this.getReceiverName(t).toLowerCase().includes(term)) ||
        (t.description?.toLowerCase().includes(term)) ||
        (t.transactionId?.toString().toLowerCase().includes(term)) ||
        (t.id?.toString().toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(t => t.status === this.selectedStatus);
    }

    // Date sorting
    if (this.selectedDateFilter === 'Date (Newest)') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateA - dateB;
      });
    }

    this.filteredTransactions = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleDateSort(): void {
    this.selectedDateFilter = this.selectedDateFilter === 'Date (Newest)' ? 'Date (Oldest)' : 'Date (Newest)';
    this.applyFilters();
  }

  openDownloadModal(): void {
    this.showDownloadModal = true;
    this.downloadStartDate = '';
    this.downloadEndDate = '';
    this.downloadDateError = '';
  }

  closeDownloadModal(): void {
    this.showDownloadModal = false;
    this.downloadStartDate = '';
    this.downloadEndDate = '';
    this.downloadDateError = '';
  }

  getDownloadCount(): number {
    if (!this.downloadStartDate && !this.downloadEndDate) {
      return this.filteredTransactions.length;
    }
    
    return this.getFilteredTransactionsByDate().length;
  }

  validateDateRange(): boolean {
    this.downloadDateError = '';
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Validate start date is not in future
    if (this.downloadStartDate) {
      const startDate = new Date(this.downloadStartDate);
      if (startDate > today) {
        this.downloadDateError = 'Start date cannot be in the future';
        this.toastService.error(this.downloadDateError);
        return false;
      }
    }
    
    // Validate end date is not in future
    if (this.downloadEndDate) {
      const endDate = new Date(this.downloadEndDate);
      if (endDate > today) {
        this.downloadDateError = 'End date cannot be in the future';
        this.toastService.error(this.downloadDateError);
        return false;
      }
    }
    
    // Validate start date is before or equal to end date
    if (this.downloadStartDate && this.downloadEndDate) {
      const startDate = new Date(this.downloadStartDate);
      const endDate = new Date(this.downloadEndDate);
      
      if (startDate > endDate) {
        this.downloadDateError = 'Start date must be before or equal to end date';
        this.toastService.error(this.downloadDateError);
        return false;
      }
    }
    
    return true;
  }
  
  onDownloadDateChange(): void {
    this.downloadDateError = '';
  }
  
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getFilteredTransactionsByDate(): Transaction[] {
    if (!this.downloadStartDate && !this.downloadEndDate) {
      return this.filteredTransactions;
    }
    
    return this.filteredTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp || t.date || '');
      const startDate = this.downloadStartDate ? new Date(this.downloadStartDate) : null;
      const endDate = this.downloadEndDate ? new Date(this.downloadEndDate) : null;
      
      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      
      return true;
    });
  }

  downloadTransactionsPDF(): void {
    // Validate date range
    if (!this.validateDateRange()) {
      return;
    }
    
    const transactionsToDownload = this.getFilteredTransactionsByDate();
    
    if (transactionsToDownload.length === 0) {
      this.toastService.error('No transactions to download');
      return;
    }
    
    try {
      // Generate HTML content for PDF
      const htmlContent = this.generateTransactionHTML(transactionsToDownload);
      
      // Create a temporary container
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      this.toastService.success(`${transactionsToDownload.length} transaction(s) ready to download`);
      this.closeDownloadModal();
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toastService.error('Failed to generate PDF');
    }
  }

  generateTransactionHTML(transactions: Transaction[]): string {
    const dateRange = this.downloadStartDate && this.downloadEndDate 
      ? `${this.downloadStartDate} to ${this.downloadEndDate}`
      : 'All Transactions';
    
    const currentDate = new Date().toLocaleString();
    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Statement</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            padding: 30px;
            color: #333;
            background: white;
          }
          
          .statement-header {
            border-bottom: 4px solid #007AFF;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 5px;
          }
          
          .statement-title {
            font-size: 20px;
            color: #333;
            font-weight: 600;
          }
          
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          
          .info-label {
            font-weight: 600;
            color: #666;
          }
          
          .info-value {
            color: #333;
            font-weight: 500;
          }
          
          .summary-box {
            background: #e3f2fd;
            border-left: 4px solid #007AFF;
            padding: 15px 20px;
            margin-bottom: 30px;
            border-radius: 4px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          
          .summary-label {
            font-weight: 600;
            color: #1565c0;
          }
          
          .summary-value {
            font-weight: bold;
            color: #0d47a1;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          thead {
            background: #007AFF;
            color: white;
          }
          
          th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          tbody tr {
            border-bottom: 1px solid #e0e0e0;
          }
          
          tbody tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          tbody tr:hover {
            background: #e3f2fd;
          }
          
          td {
            padding: 12px 10px;
            font-size: 13px;
            color: #333;
          }
          
          .amount-credit {
            color: #2e7d32;
            font-weight: 600;
          }
          
          .amount-debit {
            color: #c62828;
            font-weight: 600;
          }
          
          .status-completed {
            background: #c8e6c9;
            color: #2e7d32;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-pending {
            background: #fff9c4;
            color: #f57f17;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-failed {
            background: #ffcdd2;
            color: #c62828;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          .footer p {
            margin: 5px 0;
          }
          
          .disclaimer {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            font-size: 11px;
            color: #856404;
          }
          
          @media print {
            body {
              padding: 15px;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            thead {
              display: table-header-group;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="statement-header">
          <div class="company-name">AML FINANCIAL SERVICES</div>
          <div class="statement-title">Transaction Statement</div>
        </div>
        
        <!-- Info Section -->
        <div class="info-section">
          <div>
            <div class="info-item">
              <span class="info-label">Statement Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Period:</span>
              <span class="info-value">${dateRange}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Total Transactions:</span>
              <span class="info-value">${transactions.length}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Document ID:</span>
              <span class="info-value">STMT-${Date.now()}</span>
            </div>
          </div>
        </div>
        
        <!-- Summary Box -->
        <div class="summary-box">
          <div class="summary-row">
            <span class="summary-label">Total Transaction Volume:</span>
            <span class="summary-value">${this.formatCurrency(totalAmount, transactions[0]?.currency || 'USD')}</span>
          </div>
        </div>
        
        <!-- Transaction Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Date</th>
              <th style="width: 10%;">Transaction ID</th>
              <th style="width: 15%;">From Account</th>
              <th style="width: 15%;">To Account</th>
              <th style="width: 15%;">Receiver</th>
              <th style="width: 12%;">Amount</th>
              <th style="width: 10%;">Type</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 5%;">Description</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    transactions.forEach((transaction) => {
      const transactionType = this.getTransactionTypeFromData(transaction);
      const amountClass = transactionType === 'credit' ? 'amount-credit' : 'amount-debit';
      const statusClass = transaction.status === 'COMPLETED' ? 'status-completed' 
                        : transaction.status === 'PENDING' ? 'status-pending' 
                        : 'status-failed';
      
      html += `
            <tr>
              <td>${this.formatDate(transaction.timestamp || transaction.date || '')}</td>
              <td><strong>${transaction.transactionId || transaction.id || 'N/A'}</strong></td>
              <td>${transaction.senderAccountNumber || transaction.counterpartyAccount || transaction.accountNumber || 'N/A'}</td>
              <td>${transaction.receiverAccountNumber || transaction.counterpartyAccount || 'N/A'}</td>
              <td>${this.getReceiverName(transaction)}</td>
              <td class="${amountClass}">${this.formatCurrency(transaction.amount, transaction.currency)}</td>
              <td>${transaction.transactionType || transaction.type || 'N/A'}</td>
              <td><span class="${statusClass}">${this.getStatusLabel(transaction.status)}</span></td>
              <td>${transaction.description || '-'}</td>
            </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>AML Financial Services</strong></p>
          <p>This is a computer-generated statement and does not require a signature.</p>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="disclaimer">
          <strong>Important Notice:</strong> This statement is confidential and intended solely for the addressee. 
          If you have received this in error, please notify us immediately. Please verify all transactions and 
          report any discrepancies within 30 days.
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedDateFilter = 'Date (Newest)';
    this.selectedTransactionType = 'All';
    this.currentPage = 1;
    this.applyFilters();
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
  }

  closeDetails(): void {
    this.selectedTransaction = null;
  }

  getSelectedAccountDisplay(): string {
    const account = this.accounts.find(a => a.accountNumber === this.transactionForm.senderAccountNumber);
    if (account) {
      return `${account.accountNumber} - ${account.accountType} (${account.currency})`;
    }
    return 'Select account';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    // Handle INR currency specifically
    const currencyCode = currency || 'USD';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Invalid Date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'BLOCKED': 
      case 'FAILED': return 'status-failed';
      case 'FLAGGED': return 'status-flagged';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    return status || 'Pending';
  }

  getTypeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'TRANSFER': return 'type-transfer';
      case 'CREDIT':
      case 'DEPOSIT': return 'type-deposit';
      case 'DEBIT':
      case 'WITHDRAWAL': return 'type-withdrawal';
      default: return 'type-transfer';
    }
  }
  
  // Form tab management
  setFormTab(tab: string): void {
    this.activeFormTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  getTransactionTypeFromData(transaction: Transaction): string {
    // Try to determine transaction type from the data
    if (transaction.transactionType) {
      return transaction.transactionType.toLowerCase();
    }
    
    if (transaction.type) {
      return transaction.type.toLowerCase();
    }
    
    // Fallback logic based on account numbers or description
    const desc = transaction.description?.toLowerCase() || '';
    if (desc.includes('deposit') || desc.includes('salary') || desc.includes('credit')) {
      return 'credit';
    }
    if (desc.includes('withdrawal') || desc.includes('atm') || desc.includes('debit')) {
      return 'debit';
    }
    
    return 'transfer';
  }
  
  getTransactionTypeDisplay(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CREDIT': return 'Deposit';
      case 'DEBIT': return 'Withdrawal';
      case 'TRANSFER': return 'Transfer';
      default: return type || 'Unknown';
    }
  }
  
  // Helper methods to safely get transaction field values
  getSenderAccount(transaction: any): string {
    // Handle null/undefined values explicitly
    const senderAccount = (transaction.senderAccountNumber && transaction.senderAccountNumber !== null) ? transaction.senderAccountNumber :
           (transaction.fromAccount && transaction.fromAccount !== null) ? transaction.fromAccount :
           (transaction.sender_account_number && transaction.sender_account_number !== null) ? transaction.sender_account_number :
           (transaction.sender && transaction.sender !== null) ? transaction.sender :
           (transaction.accountNumber && transaction.accountNumber !== null) ? transaction.accountNumber :
           // For deposit/withdrawal transactions, try to extract from description
           this.extractAccountFromDescription(transaction, 'sender');
    
    // If still null/undefined, show meaningful message
    if (!senderAccount || senderAccount === 'N/A') {
      return 'Not Available';
    }
    
    return senderAccount;
  }
  
  getReceiverAccount(transaction: any): string {
    // Handle null/undefined values explicitly
    const receiverAccount = (transaction.counterpartyAccount && transaction.counterpartyAccount !== null) ? transaction.counterpartyAccount :
           (transaction.receiverAccountNumber && transaction.receiverAccountNumber !== null) ? transaction.receiverAccountNumber :
           (transaction.toAccount && transaction.toAccount !== null) ? transaction.toAccount :
           (transaction.receiver_account_number && transaction.receiver_account_number !== null) ? transaction.receiver_account_number :
           (transaction.counterparty_account && transaction.counterparty_account !== null) ? transaction.counterparty_account :
           (transaction.receiverAccount && transaction.receiverAccount !== null) ? transaction.receiverAccount :
           // For deposit/withdrawal transactions, try to extract from description
           this.extractAccountFromDescription(transaction, 'receiver');
    
    // If still null/undefined, show meaningful message
    if (!receiverAccount || receiverAccount === 'N/A') {
      return 'Not Available';
    }
    
    return receiverAccount;
  }
  
  getReceiverName(transaction: any): string {
    // Handle null/undefined values explicitly
    const receiverName = (transaction.counterpartyName && transaction.counterpartyName !== null) ? transaction.counterpartyName :
           (transaction.receiverName && transaction.receiverName !== null) ? transaction.receiverName :
           (transaction.receiver && transaction.receiver !== null) ? transaction.receiver :
           (transaction.counterparty_name && transaction.counterparty_name !== null) ? transaction.counterparty_name :
           (transaction.receiver_name && transaction.receiver_name !== null) ? transaction.receiver_name :
           (transaction.toName && transaction.toName !== null) ? transaction.toName :
           (transaction.beneficiaryName && transaction.beneficiaryName !== null) ? transaction.beneficiaryName :
           // For deposit/withdrawal, provide meaningful names
           this.getTransactionTypeName(transaction);
    
    // If still null/undefined, show transaction type as fallback
    if (!receiverName || receiverName === 'N/A') {
      return transaction.transactionType || transaction.type || 'Unknown';
    }
    
    return receiverName;
  }
  
  // Helper method to extract account info from description for deposit/withdrawal
  extractAccountFromDescription(transaction: any, type: 'sender' | 'receiver'): string {
    const description = transaction.description || '';
    const transactionType = transaction.transactionType || '';
    
    // For deposits and withdrawals, we need to infer the account info
    if (transactionType === 'CREDIT' || description.toLowerCase().includes('deposit')) {
      return type === 'sender' ? 'External Source' : 'Your Account';
    } else if (transactionType === 'DEBIT' || description.toLowerCase().includes('withdrawal')) {
      return type === 'sender' ? 'Your Account' : 'External Destination';
    }
    
    return 'N/A';
  }
  
  // Helper method to get meaningful names for transaction types
  getTransactionTypeName(transaction: any): string {
    const transactionType = transaction.transactionType || '';
    const description = transaction.description || '';
    
    if (transactionType === 'CREDIT' || description.toLowerCase().includes('deposit')) {
      return 'External Deposit';
    } else if (transactionType === 'DEBIT' || description.toLowerCase().includes('withdrawal')) {
      return 'Cash Withdrawal';
    } else if (transactionType === 'TRANSFER') {
      return 'Transfer Recipient';
    }
    
    return 'N/A';
  }
  
  // Deposit submission
  submitDeposit(): void {
    if (!this.depositForm.accountNumber || !this.depositForm.amount) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    if (this.depositForm.amount <= 0) {
      this.toastService.error('Amount must be greater than 0');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const depositData = {
      accountNumber: this.depositForm.accountNumber,
      amount: this.depositForm.amount,
      description: this.depositForm.source || 'External deposit',
      source: this.depositForm.source || 'External'
    };

    console.log('Submitting deposit:', depositData);

    this.transactionService.createDeposit(depositData).subscribe({
      next: (newTransaction) => {
        console.log('Deposit successful:', newTransaction);
        this.toastService.success('Deposit processed successfully!');
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetDepositForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Deposit failed:', error);
        let errorMessage = 'Failed to process deposit. Please try again.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check your account permissions.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid deposit request. Please check your input.';
        }
        
        this.toastService.error(errorMessage);
        this.isSubmitting = false;
      }
    });
  }
  
  // Withdrawal submission
  submitWithdrawal(): void {
    if (!this.withdrawalForm.accountNumber || !this.withdrawalForm.amount) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    if (this.withdrawalForm.amount <= 0) {
      this.toastService.error('Amount must be greater than 0');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const withdrawalData = {
      accountNumber: this.withdrawalForm.accountNumber,
      amount: this.withdrawalForm.amount,
      description: this.withdrawalForm.purpose || 'Cash withdrawal',
      purpose: this.withdrawalForm.purpose || 'Personal use'
    };

    console.log('Submitting withdrawal:', withdrawalData);

    this.transactionService.createWithdrawal(withdrawalData).subscribe({
      next: (newTransaction) => {
        console.log('Withdrawal successful:', newTransaction);
        this.toastService.success('Withdrawal processed successfully!');
        this.transactions.unshift(newTransaction);
        this.applyFilters();
        this.resetWithdrawalForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Withdrawal failed:', error);
        let errorMessage = 'Failed to process withdrawal. Please try again.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check your account permissions.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid withdrawal request. Please check your input.';
        }
        
        this.toastService.error(errorMessage);
        this.isSubmitting = false;
      }
    });
  }
  
  resetDepositForm(): void {
    this.depositForm = {
      accountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      amount: 0,
      source: ''
    };
  }
  
  resetWithdrawalForm(): void {
    this.withdrawalForm = {
      accountNumber: this.accounts.length > 0 ? this.accounts[0].accountNumber : '',
      amount: 0,
      purpose: ''
    };
  }

  // Currency conversion methods
  loadSupportedCurrencies(): void {
    this.currencyService.getSupportedCurrencies().subscribe({
      next: (currencies) => {
        this.supportedCurrencies = currencies;
        console.log('Supported currencies loaded:', currencies);
      },
      error: (error) => {
        console.error('Error loading supported currencies:', error);
        this.toastService.error('Failed to load supported currencies');
      }
    });
  }

  openCurrencyCalculator(): void {
    this.showCurrencyCalculator = true;
    this.currencyCalculator.amount = this.transactionForm.amount || 0;
  }

  closeCurrencyCalculator(): void {
    this.showCurrencyCalculator = false;
    this.conversionResult = null;
  }

  calculateCurrency(): void {
    if (!this.currencyCalculator.amount || this.currencyCalculator.amount <= 0) {
      this.toastService.error('Please enter a valid amount');
      return;
    }

    this.isConverting = true;
    this.currencyService.convertCurrency(
      this.currencyCalculator.fromCurrency,
      this.currencyCalculator.toCurrency,
      this.currencyCalculator.amount
    ).subscribe({
      next: (result) => {
        this.conversionResult = result;
        this.isConverting = false;
        console.log('Currency conversion result:', result);
      },
      error: (error) => {
        console.error('Currency conversion error:', error);
        this.toastService.error('Failed to convert currency. Please try again.');
        this.isConverting = false;
      }
    });
  }

  useCurrencyConversion(): void {
    if (this.conversionResult) {
      this.transactionForm.amount = this.conversionResult.originalAmount;
      this.updateConvertedAmountDisplay();
      this.closeCurrencyCalculator();
      this.toastService.success('Currency conversion applied to transaction');
    }
  }

  // Update converted amount display when amount changes
  updateConvertedAmountDisplay(): void {
    if (this.transactionForm.amount > 0) {
      // Get sender account currency
      const senderAccount = this.accounts.find(acc => acc.accountNumber === this.transactionForm.senderAccountNumber);
      if (senderAccount && senderAccount.currency !== 'INR') {
        // Convert to INR for display
        this.currencyService.convertCurrency(senderAccount.currency, 'INR', this.transactionForm.amount).subscribe({
          next: (result) => {
            this.convertedAmountDisplay = `≈ ₹${result.convertedAmount.toFixed(2)} INR`;
          },
          error: () => {
            this.convertedAmountDisplay = '';
          }
        });
      } else {
        this.convertedAmountDisplay = '';
      }
    } else {
      this.convertedAmountDisplay = '';
    }
  }

  // Call this when amount changes
  onAmountChange(): void {
    this.updateConvertedAmountDisplay();
  }
}
