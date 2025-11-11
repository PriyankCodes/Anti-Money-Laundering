import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceService, Alert, Transaction } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-customer-alert-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './customer-alert-history.html',
  styleUrls: ['./customer-alert-history.css']
})
export class CustomerAlertHistory implements OnInit {
  customerId: number | null = null;
  customerName: string = '';
  searchQuery: string = '';
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Modal properties
  showAlertModal = false;
  selectedAlert: Alert | null = null;
  selectedTransaction: Transaction | null = null;
  customerTransactions: Transaction[] = [];
  loadingTransactions = false;
  loadingAccountDetails = false;
  senderAccountDetails: any = null;
  receiverAccountDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complianceService: ComplianceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['customerId']) {
        this.customerId = parseInt(params['customerId']);
        this.loadCustomerAlertHistory();
      }
    });
  }

  searchByCustomer(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Please enter a customer name or ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    // Try to parse as number for ID search
    const searchId = parseInt(this.searchQuery);
    
    if (!isNaN(searchId)) {
      // Search by ID
      this.customerId = searchId;
      this.loadCustomerAlertHistory();
    } else {
      // Search by name - we'll need to get all alerts and filter
      this.complianceService.getAllAlerts().subscribe({
        next: (allAlerts) => {
          const customerAlerts = allAlerts.filter(alert => 
            alert.customerName.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
          
          if (customerAlerts.length > 0) {
            this.customerId = customerAlerts[0].customerId;
            this.customerName = customerAlerts[0].customerName;
            this.alerts = customerAlerts;
            this.filteredAlerts = customerAlerts;
          } else {
            this.errorMessage = 'No customer found with that name';
            this.alerts = [];
            this.filteredAlerts = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching customer:', error);
          this.errorMessage = 'Failed to search customer';
          this.isLoading = false;
        }
      });
    }
  }

  loadCustomerAlertHistory(): void {
    if (!this.customerId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.complianceService.getAlertHistoryByCustomer(this.customerId).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.filteredAlerts = alerts;
        if (alerts.length > 0) {
          this.customerName = alerts[0].customerName;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer alert history:', error);
        this.errorMessage = 'Failed to load customer alert history';
        this.isLoading = false;
      }
    });
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 40) return 'high';
    return 'medium';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'INVESTIGATING': 'status-investigating',
      'POSITIVE': 'status-positive',
      'NEGATIVE': 'status-negative',
      'ESCALATED': 'status-escalated',
      'COMPLETED': 'status-completed'
    };
    return statusMap[status] || 'status-open';
  }

  viewAlertDetails(alertId: number): void {
    // Open modal instead of navigating
    this.showAlertModal = true;
    this.loadingTransactions = true;
    this.loadingAccountDetails = true;
    
    // Load alert details
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        
        // Load transaction details if available
        if (alert.transactionId) {
          this.complianceService.getCustomerTransactions(alert.customerId).subscribe({
            next: (transactions) => {
              this.customerTransactions = transactions;
              
              const foundTransaction = transactions.find(t => t.transactionId === alert.transactionId);
              
              if (foundTransaction) {
                this.selectedTransaction = foundTransaction;
                
                // Create sender account details
                this.senderAccountDetails = {
                  customerName: foundTransaction.customerName,
                  customerEmail: foundTransaction.customerEmail,
                  accountNumber: foundTransaction.senderAccountNumber,
                  accountType: 'SAVINGS',
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                // Create receiver account details
                this.receiverAccountDetails = {
                  customerName: foundTransaction.counterpartyName,
                  customerEmail: null,
                  accountNumber: foundTransaction.counterpartyAccount,
                  accountType: 'SAVINGS',
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                this.loadingAccountDetails = false;
              } else {
                this.loadingAccountDetails = false;
              }
              
              this.loadingTransactions = false;
            },
            error: (error) => {
              console.error('Error loading customer transactions:', error);
              this.loadingAccountDetails = false;
              this.loadingTransactions = false;
            }
          });
        } else {
          this.loadingAccountDetails = false;
          this.loadingTransactions = false;
          this.selectedTransaction = null;
          
          // Still load customer transactions
          if (alert.customerId) {
            this.complianceService.getCustomerTransactions(alert.customerId).subscribe({
              next: (transactions) => {
                this.customerTransactions = transactions;
                this.loadingTransactions = false;
              },
              error: (error) => {
                console.error('Error loading transactions:', error);
                this.loadingTransactions = false;
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
        this.toastService.error('Failed to load alert details');
        this.closeAlertModal();
      }
    });
  }
  
  closeAlertModal(): void {
    this.showAlertModal = false;
    this.selectedAlert = null;
    this.selectedTransaction = null;
    this.senderAccountDetails = null;
    this.receiverAccountDetails = null;
    this.customerTransactions = [];
  }
  
  getRuleDescription(rule: string, alert?: any): string {
    // Always use dynamic description from database
    if (alert && alert.ruleDescription) {
      return alert.ruleDescription;
    }
    
    // If no alert or no description, return default message
    return 'No rule description available';
  }

  goBack(): void {
    this.router.navigate(['/compliance/alerts']);
  }
}
