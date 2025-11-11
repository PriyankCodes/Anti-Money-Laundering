import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService, AlertNotification, AlertStats, CustomerTicket } from '../../../core/services/alert.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts-new.html',
  styleUrls: ['./alerts-tabs.css'],
})
export class Alerts implements OnInit {
  alerts: AlertNotification[] = [];
  filteredAlerts: AlertNotification[] = [];
  loading: boolean = false;
  
  // Tickets
  tickets: CustomerTicket[] = [];
  loadingTickets: boolean = false;
  ticketFilter: string = 'all';
  
  // Statistics
  stats: AlertStats = {
    pending: 0,
    resolved: 0,
    total: 0
  };
  
  // Filter states
  activeTab: 'all' | 'pending' | 'resolved' = 'all';
  activeMainTab: 'alerts' | 'tickets' = 'alerts';
  alertFilter: 'all' | 'pending' | 'investigating' | 'decided' = 'all';
  searchTerm: string = '';
  viewMode: 'grid' | 'list' = 'grid';
  ticketViewMode: 'grid' | 'list' = 'grid';
  
  // Modal states
  showDetailsModal: boolean = false;
  showPendingModal: boolean = false;
  showInvestigatingModal: boolean = false;
  showDecisionModal: boolean = false;
  showContactModal: boolean = false;
  showTicketDetailsModal: boolean = false;
  selectedAlert: AlertNotification | null = null;
  selectedTicket: CustomerTicket | null = null;
  contactMessage: string = '';
  sendingMessage: boolean = false;

  constructor(
    private alertService: AlertService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.loadStats();
    this.loadTickets();
  }

  // Load alerts from API
  loadAlerts(): void {
    this.loading = true;
    this.alertService.getCustomerAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.loading = false;
      }
    });
  }

  // Load statistics
  loadStats(): void {
    this.alertService.getAlertStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // Calculate stats from alerts if API fails
        this.calculateStatsFromAlerts();
      }
    });
  }

  // Load tickets
  loadTickets(): void {
    this.loadingTickets = true;
    this.alertService.getCustomerTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.loadingTickets = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.loadingTickets = false;
      }
    });
  }

  // Calculate stats from loaded alerts
  calculateStatsFromAlerts(): void {
    this.stats = {
      pending: this.alerts.filter(a => a.status === 'PENDING' || a.status === 'FLAGGED').length,
      resolved: this.alerts.filter(a => a.status === 'RESOLVED').length,
      total: this.alerts.length
    };
  }

  // Apply filters
  applyFilters(): void {
    let filtered = [...this.alerts];

    // Tab filter
    if (this.activeTab === 'pending') {
      filtered = filtered.filter(alert => 
        alert.status === 'PENDING' || alert.status === 'FLAGGED'
      );
    } else if (this.activeTab === 'resolved') {
      filtered = filtered.filter(alert => alert.status === 'RESOLVED');
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.transactionId.toLowerCase().includes(searchLower) ||
        alert.reason.toLowerCase().includes(searchLower) ||
        alert.amount.toString().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.filteredAlerts = filtered;
  }

  // Switch tabs
  switchTab(tab: 'all' | 'pending' | 'resolved'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // Get filtered alerts based on filter
  getFilteredAlerts(): AlertNotification[] {
    if (this.alertFilter === 'all') {
      return this.alerts;
    } else if (this.alertFilter === 'pending') {
      return this.getPendingAlerts();
    } else if (this.alertFilter === 'investigating') {
      return this.getInvestigatingAlerts();
    } else if (this.alertFilter === 'decided') {
      return this.getDecidedAlerts();
    }
    return this.alerts;
  }

  // Search
  onSearchChange(): void {
    this.applyFilters();
  }

  // View alert details - opens appropriate modal based on status
  viewDetails(alert: AlertNotification): void {
    this.selectedAlert = alert;
    
    // Determine which modal to show based on alert status
    const status = alert.status.toUpperCase();
    
    if (status === 'OPEN' || status === 'NEW' || status === 'PENDING') {
      this.showPendingModal = true;
    } else if (status === 'INVESTIGATING' || status === 'IN_PROGRESS') {
      this.showInvestigatingModal = true;
    } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'COMPLETED' || status === 'TRUE_POSITIVE' || status === 'FALSE_POSITIVE') {
      this.showDecisionModal = true;
    } else {
      // Fallback to general details modal
      this.showDetailsModal = true;
    }
  }

  // Open contact support modal
  openContactModal(alert: AlertNotification): void {
    this.selectedAlert = alert;
    this.contactMessage = '';
    this.showContactModal = true;
  }

  // Send contact support message
  contactSupport(): void {
    if (!this.selectedAlert || !this.contactMessage.trim()) {
      return;
    }

    // Check if alert is assigned to an officer
    if (!this.selectedAlert.assignedOfficer) {
      this.toastService.error('This alert has not been assigned to an officer yet. Please wait for assignment before creating a support ticket.');
      return;
    }

    this.sendingMessage = true;
    this.alertService.contactSupport(this.selectedAlert.id, this.contactMessage, this.selectedAlert).subscribe({
      next: () => {
        this.toastService.success('Your inquiry has been submitted to the assigned compliance officer. You will receive a response within 24-48 hours.');
        this.closeModals();
        this.loadTickets(); // Reload tickets to show the new one
      },
      error: (error) => {
        console.error('Error contacting support:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to send inquiry. Please try again.';
        this.toastService.error(errorMsg);
        this.sendingMessage = false;
      }
    });
  }

  // Close modals
  closeModals(): void {
    this.showDetailsModal = false;
    this.showPendingModal = false;
    this.showInvestigatingModal = false;
    this.showDecisionModal = false;
    this.showContactModal = false;
    this.showTicketDetailsModal = false;
    this.selectedAlert = null;
    this.selectedTicket = null;
    this.contactMessage = '';
    this.sendingMessage = false;
  }

  // View ticket details
  viewTicketDetails(ticket: CustomerTicket): void {
    this.selectedTicket = ticket;
    this.showTicketDetailsModal = true;
  }

  // Ticket filter methods
  setTicketFilter(filter: string): void {
    this.ticketFilter = filter;
  }

  getTicketsByStatus(status: string): CustomerTicket[] {
    return this.tickets.filter(ticket => ticket.status === status);
  }

  getFilteredTickets(): CustomerTicket[] {
    if (this.ticketFilter === 'all') {
      return this.tickets;
    }
    return this.tickets.filter(ticket => ticket.status === this.ticketFilter);
  }

  // Get ticket card class based on status
  getTicketCardClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'ticket-card-in-progress';
      case 'RESOLVED': return 'ticket-card-resolved';
      case 'CLOSED': return 'ticket-card-closed';
      default: return '';
    }
  }

  // Get ticket status badge class
  getTicketStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return 'status-open';
    }
  }

  // Get ticket priority badge class
  getTicketPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  // Get alerts by category
  getPendingAlerts(): AlertNotification[] {
    return this.alerts.filter(a => 
      a.status === 'PENDING' || a.status === 'OPEN' || a.status === 'NEW' || a.status === 'FLAGGED'
    );
  }

  getInvestigatingAlerts(): AlertNotification[] {
    return this.alerts.filter(a => 
      a.status === 'INVESTIGATING' || a.status === 'IN_PROGRESS'
    );
  }

  getDecidedAlerts(): AlertNotification[] {
    return this.alerts.filter(a => 
      a.status === 'RESOLVED' || a.status === 'CLOSED' || a.status === 'COMPLETED' || 
      a.status.includes('TRUE_POSITIVE') || a.status.includes('FALSE_POSITIVE')
    );
  }

  // Get alert icon class
  getAlertIconClass(alert: AlertNotification): string {
    if (alert.type === 'CANCELED' || alert.status === 'CANCELED') {
      return 'alert-icon-canceled';
    }
    if (alert.severity === 'HIGH' || alert.type === 'SUSPICIOUS') {
      return 'alert-icon-high';
    }
    return 'alert-icon-warning';
  }

  // Get alert type label
  getAlertTypeLabel(alert: AlertNotification): string {
    if (alert.type === 'CANCELED') return 'Canceled Transaction';
    if (alert.type === 'SUSPICIOUS') return 'Suspicious Activity';
    return 'Flagged Transaction';
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Format ticket description for better display (customer view - simplified)
  formatTicketDescription(description: string): string {
    if (!description) return '';
    
    // Split description into sections
    const sections = description.split(/\n\n/);
    let formatted = '';
    
    for (let section of sections) {
      section = section.trim();
      if (!section) continue;
      
      // Alert Inquiry Header
      if (section.includes('ALERT INQUIRY')) {
        const title = section.replace('ALERT INQUIRY - ', '').replace('ALERT INQUIRY', 'Alert Inquiry');
        formatted += `<div class="inquiry-header"><h4>${title}</h4></div>`;
      }
      // Alert Details Section - Filter out Reason, Severity, Action Required
      else if (section.startsWith('ALERT DETAILS:')) {
        formatted += '<div class="alert-details">';
        formatted += '<h4>Alert Details</h4>';
        const details = section.replace('ALERT DETAILS:', '').trim();
        const lines = details.split('\n');
        formatted += '<div class="details-grid">';
        for (const line of lines) {
          if (line.trim().startsWith('- ')) {
            const [label, ...valueParts] = line.trim().substring(2).split(':');
            const value = valueParts.join(':').trim();
            // Only show Alert ID, Transaction ID, Amount, Status, Date
            if (label && !label.includes('Reason') && !label.includes('Severity')) {
              formatted += `<div class="detail-item"><span class="label">${label}</span><span class="value">${value}</span></div>`;
            }
          }
        }
        formatted += '</div></div>';
      }
      // Customer Message Section - Highlighted
      else if (section.startsWith('CUSTOMER MESSAGE:')) {
        formatted += '<div class="customer-message">';
        formatted += '<h4>Customer Message</h4>';
        const message = section.replace('CUSTOMER MESSAGE:', '').trim();
        formatted += `<p class="message-content">${message}</p>`;
        formatted += '</div>';
      }
      // Skip Action Required section for customer view
      // (Do not process ACTION REQUIRED section)
    }
    
    return formatted;
  }

  // Navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
