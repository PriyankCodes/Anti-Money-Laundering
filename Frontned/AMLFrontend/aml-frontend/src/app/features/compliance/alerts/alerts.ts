import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Alert, Transaction } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  Math = Math; // Expose Math to template
  activeTab: 'all' | 'assigned' = 'all';
  isLoading = false;
  allAlerts: Alert[] = [];
  assignedAlerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  
  // Investigation Modal
  showInvestigationModal = false;
  showDetailedReview = false;
  selectedAlert: Alert | null = null;
  selectedTransaction: Transaction | null = null;
  senderAccountDetails: any = null;
  receiverAccountDetails: any = null;
  customerTransactions: Transaction[] = [];
  loadingTransactions = false;
  loadingAccountDetails = false;
  investigationNotes = '';
  investigationAction = 'TRUE_POSITIVE';
  
  // Customer Alert History (shown within modal)
  showCustomerHistory = false;
  customerAlertHistory: Alert[] = [];
  loadingCustomerHistory = false;
  
  // Filters
  filterStatus = 'all';
  filterRiskLevel = 'all';
  searchQuery = '';
  sortNewestFirst = true; // Default to newest first
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  paginatedAlerts: Alert[] = [];
  
  errorMessage = '';
  successMessage = '';
  
  // Assignment Confirmation Modal
  showAssignmentModal = false;
  pendingAssignmentAlert: Alert | null = null;

  constructor(
    private complianceService: ComplianceService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Check for query parameters first
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['filter'] === 'assigned') {
        this.activeTab = 'assigned';
      }
    });
    
    this.loadAlerts();
    
    // Check if there's an alert ID in the route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.openInvestigation(parseInt(params['id']));
      }
    });
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load all alerts
    this.complianceService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.allAlerts = alerts;
        if (this.activeTab === 'all') {
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.errorMessage = 'Failed to load alerts';
        this.isLoading = false;
      }
    });
    
    // Load assigned alerts
    this.complianceService.getMyAssignedAlerts().subscribe({
      next: (alerts) => {
        this.assignedAlerts = alerts;
        if (this.activeTab === 'assigned') {
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assigned alerts:', error);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'all' | 'assigned'): void {
    this.activeTab = tab;
    this.currentPage = 1; // Reset to first page when switching tabs
    this.applyFilters();
  }

  getOpenAlertsCount(): number {
    // Count only unassigned open alerts
    return this.allAlerts.filter(alert => 
      !alert.assignedOfficerName && alert.status === 'OPEN'
    ).length;
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAlerts = this.filteredAlerts.slice(startIndex, endIndex);
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

  applyFilters(): void {
    let alerts = this.activeTab === 'all' ? this.allAlerts : this.assignedAlerts;
    
    // For "All Open Alerts" tab, show only unassigned alerts
    if (this.activeTab === 'all') {
      alerts = alerts.filter(a => this.isUnassigned(a));
    }
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      alerts = alerts.filter(a => a.status === this.filterStatus);
    }
    
    // Filter by risk level
    if (this.filterRiskLevel !== 'all') {
      if (this.filterRiskLevel === 'high') {
        alerts = alerts.filter(a => a.riskScore >= 70);
      } else if (this.filterRiskLevel === 'medium') {
        alerts = alerts.filter(a => a.riskScore >= 40 && a.riskScore < 70);
      } else if (this.filterRiskLevel === 'low') {
        alerts = alerts.filter(a => a.riskScore < 40);
      }
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      alerts = alerts.filter(a => 
        a.customerName.toLowerCase().includes(query) ||
        a.ruleTriggered.toLowerCase().includes(query) ||
        a.alertId.toString().includes(query)
      );
    }
    
    // Sort by date
    alerts = this.sortAlerts(alerts);
    
    this.filteredAlerts = alerts;
    this.currentPage = 1; // Reset to first page when filters change
    this.updatePagination();
  }

  sortAlerts(alerts: Alert[]): Alert[] {
    return alerts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (this.sortNewestFirst) {
        return dateB - dateA; // Newest first (descending)
      } else {
        return dateA - dateB; // Oldest first (ascending)
      }
    });
  }

  toggleSortOrder(): void {
    this.sortNewestFirst = !this.sortNewestFirst;
    this.applyFilters();
  }

  assignToMe(alert: Alert, event: Event): void {
    event.stopPropagation();
    
    this.pendingAssignmentAlert = alert;
    this.showAssignmentModal = true;
  }

  openInvestigation(alertId: number): void {
    this.loadingTransactions = true;
    this.loadingAccountDetails = true;
    this.showInvestigationModal = true;
    this.showDetailedReview = false;
    this.investigationNotes = '';
    this.investigationAction = 'TRUE_POSITIVE';
    this.selectedTransaction = null;
    this.senderAccountDetails = null;
    this.receiverAccountDetails = null;
    
    // Load alert details
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        console.log('Alert loaded:', alert);
        console.log('Rule Description:', alert.ruleDescription);
        console.log('Rule Type:', alert.ruleType);
        
        // Load transaction details if available
        if (alert.transactionId) {
          // First, try to find transaction in customer transactions
          this.complianceService.getCustomerTransactions(alert.customerId).subscribe({
            next: (transactions) => {
              this.customerTransactions = transactions;
              
              // Find the specific transaction
              const foundTransaction = transactions.find(t => t.transactionId === alert.transactionId);
              
              if (foundTransaction) {
                this.selectedTransaction = foundTransaction;
                console.log('Transaction found in customer transactions:', foundTransaction);
                
                // Create sender account details from transaction data
                this.senderAccountDetails = {
                  customerName: foundTransaction.customerName,
                  customerEmail: foundTransaction.customerEmail,
                  accountNumber: foundTransaction.senderAccountNumber,
                  accountType: 'SAVINGS', // Default type, can be updated if available
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                // Create receiver account details from transaction data
                this.receiverAccountDetails = {
                  customerName: foundTransaction.counterpartyName,
                  customerEmail: null,
                  accountNumber: foundTransaction.counterpartyAccount,
                  accountType: 'SAVINGS', // Default type, can be updated if available
                  balance: null,
                  currency: foundTransaction.currency,
                  status: 'ACTIVE'
                };
                
                console.log('Sender account details created:', this.senderAccountDetails);
                console.log('Receiver account details created:', this.receiverAccountDetails);
                
                this.loadingAccountDetails = false;
              } else {
                console.log('Transaction not found in customer transactions');
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
          console.log('No transaction ID found for alert');
          this.loadingAccountDetails = false;
          this.loadingTransactions = false;
          this.selectedTransaction = null;
          
          // Still load customer transactions even if no transaction ID
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
        this.errorMessage = 'Failed to load alert details';
        this.closeInvestigationModal();
      }
    });
  }

  closeInvestigationModal(): void {
    this.showInvestigationModal = false;
    this.selectedAlert = null;
    this.selectedTransaction = null;
    this.senderAccountDetails = null;
    this.receiverAccountDetails = null;
    this.customerTransactions = [];
    this.investigationNotes = '';
    this.investigationAction = 'TRUE_POSITIVE';
    this.showCustomerHistory = false;
    this.customerAlertHistory = [];
  }

  viewCustomerAlertHistory(customerId: number): void {
    // Load history within the modal instead of navigating away
    this.showCustomerHistory = true;
    this.loadingCustomerHistory = true;
    
    this.complianceService.getAlertHistoryByCustomer(customerId).subscribe({
      next: (alerts) => {
        this.customerAlertHistory = alerts;
        this.loadingCustomerHistory = false;
      },
      error: (error) => {
        console.error('Error loading customer alert history:', error);
        this.toastService.error('Failed to load customer alert history');
        this.loadingCustomerHistory = false;
      }
    });
  }
  
  closeCustomerHistory(): void {
    this.showCustomerHistory = false;
    this.customerAlertHistory = [];
  }

  submitInvestigation(): void {
    if (!this.selectedAlert || !this.investigationNotes.trim()) {
      this.toastService.error('Please provide investigation notes');
      return;
    }
    
    // Check if alert already has a final decision
    if (this.isFinalStatus(this.selectedAlert.status)) {
      this.toastService.error(`Cannot change status. Alert already marked as ${this.selectedAlert.status}. This is a final decision.`);
      return;
    }
    
    // Check if alert is assigned to another officer
    if (this.selectedAlert.assignedOfficerName && !this.isAlertAssignedToMe(this.selectedAlert)) {
      this.toastService.error(`This alert is assigned to ${this.selectedAlert.assignedOfficerName}. Only the assigned officer can take action.`);
      return;
    }
    
    // Backend expects: action (for logging) and decision (for status update)
    const request = {
      action: this.investigationAction,
      decision: this.investigationAction,  // Backend uses 'decision' field
      notes: this.investigationNotes
    };
    
    console.log('Submitting investigation:', request);
    
    this.complianceService.takeActionOnAlert(this.selectedAlert.alertId, request).subscribe({
      next: (updatedAlert) => {
        this.toastService.success(`Investigation action "${this.investigationAction}" recorded successfully`);
        this.closeInvestigationModal();
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error submitting investigation:', error);
        
        // Handle different error scenarios
        if (error.status === 403 || error.status === 401) {
          this.toastService.error('You do not have permission to take action on this alert. It may be assigned to another officer.');
        } else if (error.status === 409) {
          this.toastService.error('This alert has already been processed by another officer.');
        } else if (error.status === 500) {
          const errorMsg = error.error?.message || error.error?.error || 'Server error occurred';
          if (errorMsg.toLowerCase().includes('assigned') || errorMsg.toLowerCase().includes('officer')) {
            this.toastService.error('This alert is assigned to another officer. Only the assigned officer can take action.');
          } else if (errorMsg.toLowerCase().includes('status')) {
            this.toastService.error('Cannot change status. This alert may have been finalized by another officer.');
          } else {
            this.toastService.error(`Failed to submit investigation: ${errorMsg}`);
          }
        } else {
          this.toastService.error(error.error?.message || 'Failed to submit investigation. Please try again.');
        }
      }
    });
  }

  navigateToSAR(alert: Alert): void {
    this.router.navigate(['/compliance/sar'], { 
      queryParams: { alertId: alert.alertId } 
    });
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'INVESTIGATING': 'status-investigating',
      'UNDER_INVESTIGATION': 'status-investigating',
      'TRUE_POSITIVE': 'status-positive',
      'FALSE_POSITIVE': 'status-negative',
      'ESCALATED': 'status-escalated'
    };
    return statusMap[status] || 'status-open';
  }

  parseTriggeredRules(ruleString: string): string[] {
    if (!ruleString) return [];
    // Split by comma and trim each rule
    return ruleString.split(',').map(rule => rule.trim()).filter(rule => rule.length > 0);
  }

  getRuleType(rule: string, alert?: Alert): string {
    // If alert has multiple rule types, find the matching one
    if (alert && alert.ruleTypes && alert.ruleTypes.length > 0) {
      const ruleNames = this.parseTriggeredRules(alert.ruleTriggered);
      const ruleIndex = ruleNames.findIndex(r => r === rule);
      if (ruleIndex >= 0 && ruleIndex < alert.ruleTypes.length) {
        return alert.ruleTypes[ruleIndex];
      }
      // Fallback to first type
      return alert.ruleTypes[0];
    }
    
    // Backward compatibility: use single ruleType
    if (alert && alert.ruleType) {
      return alert.ruleType;
    }
    
    // If no alert or no ruleType, return UNKNOWN
    return 'UNKNOWN';
  }

  getRuleDescription(rule: string, alert?: Alert): string {
    // If alert has multiple rule descriptions, find the matching one
    if (alert && alert.ruleDescriptions && alert.ruleDescriptions.length > 0) {
      const ruleNames = this.parseTriggeredRules(alert.ruleTriggered);
      const ruleIndex = ruleNames.findIndex(r => r === rule);
      if (ruleIndex >= 0 && ruleIndex < alert.ruleDescriptions.length) {
        return alert.ruleDescriptions[ruleIndex];
      }
      // Fallback to first description
      return alert.ruleDescriptions[0];
    }
    
    // Backward compatibility: use single ruleDescription
    if (alert && alert.ruleDescription) {
      return alert.ruleDescription;
    }
    
    // If no alert or no description, return default message
    return 'No rule description available';
  }

  isUnassigned(alert: Alert): boolean {
    return !alert.assignedOfficerName || alert.assignedOfficerName.trim() === '';
  }

  isAlertAssignedToMe(alert: Alert): boolean {
    // Get current officer's name from localStorage
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    const currentOfficerName = `${firstName} ${lastName}`.trim();
    
    // Check if alert is assigned to current officer
    if (!alert.assignedOfficerName || !currentOfficerName) {
      return false;
    }
    
    return alert.assignedOfficerName.toLowerCase() === currentOfficerName.toLowerCase();
  }

  isFinalStatus(status: string): boolean {
    const finalStatuses = ['TRUE_POSITIVE', 'FALSE_POSITIVE'];
    return finalStatuses.includes(status);
  }

  canTakeAction(): boolean {
    if (!this.selectedAlert) return false;
    
    // Cannot take action if status is final
    if (this.isFinalStatus(this.selectedAlert.status)) {
      return false;
    }
    
    // Cannot take action if assigned to another officer
    if (this.selectedAlert.assignedOfficerName && !this.isAlertAssignedToMe(this.selectedAlert)) {
      return false;
    }
    
    return true;
  }

  confirmAssignment(): void {
    this.showAssignmentModal = false;
    
    if (!this.pendingAssignmentAlert) return;
    
    const alert = this.pendingAssignmentAlert;
    this.pendingAssignmentAlert = null;
    
    this.complianceService.assignAlertToMe(alert.alertId).subscribe({
      next: (updatedAlert) => {
        this.toastService.success(`Alert #${alert.alertId} has been successfully assigned to you and status changed to Under Investigation`);
        
        // Update the alert status locally
        alert.status = 'UNDER_INVESTIGATION';
        
        // Remove from unassigned list immediately
        this.allAlerts = this.allAlerts.filter(a => a.alertId !== alert.alertId);
        this.applyFilters();
        
        // Reload to get updated data with new status
        this.loadAlerts();
      },
      error: (error) => {
        console.error('Error assigning alert:', error);
        this.toastService.error('Failed to assign alert. Please try again.');
      }
    });
  }

  cancelAssignment(): void {
    this.showAssignmentModal = false;
    this.pendingAssignmentAlert = null;
  }
}
