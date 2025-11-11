import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Ticket, TicketResponse } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html',
  styleUrls: ['./tickets.css']
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Filters
  filterStatus: string = 'all';
  filterPriority: string = 'all';
  searchQuery = '';

  // Ticket Detail Modal
  showTicketModal = false;
  selectedTicket: Ticket | null = null;
  ticketResponses: TicketResponse[] = [];
  loadingResponses = false;
  responseMessage = '';
  sendingResponse = false;

  // Status update
  updatingStatus = false;
  updatingPriority = false;
  newStatus = '';
  
  // Resolution modal for RESOLVED status
  showResolutionModal = false;
  resolutionText = '';

  constructor(
    private complianceService: ComplianceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.complianceService.getMyTickets().subscribe({
      next: (tickets) => {
        console.log('Tickets received from backend:', tickets);
        if (tickets.length > 0) {
          console.log('First ticket sample:', tickets[0]);
        }
        this.tickets = tickets;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        
        // Check if it's a 500 error (backend not implemented)
        if (error.status === 500) {
          this.errorMessage = 'Ticket system is not yet configured in the backend. Please contact your administrator.';
        } else if (error.status === 404) {
          this.errorMessage = 'Ticket endpoint not found. The backend may need to be updated.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load tickets. Please try again later.';
        }
        
        this.isLoading = false;
        this.tickets = [];
        this.filteredTickets = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tickets];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        t.ticketId.toString().includes(query)
      );
    }

    this.filteredTickets = filtered;
  }

  openTicketModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.newStatus = ticket.status; // Initialize with current status
    this.showTicketModal = true;
    this.responseMessage = '';
    this.loadTicketResponses(ticket.ticketId);
  }
  
  isStatusLocked(): boolean {
    if (!this.selectedTicket) return true;
    return this.selectedTicket.status === 'CLOSED' || this.selectedTicket.status === 'RESOLVED';
  }

  loadTicketResponses(ticketId: number): void {
    this.loadingResponses = true;
    this.complianceService.getTicketResponses(ticketId).subscribe({
      next: (responses) => {
        this.ticketResponses = responses;
        this.loadingResponses = false;
      },
      error: (error) => {
        console.error('Error loading responses:', error);
        this.ticketResponses = [];
        this.loadingResponses = false;
        // Don't show error to user - just log it and continue with empty responses
      }
    });
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
    this.ticketResponses = [];
    this.responseMessage = '';
  }

  submitResponse(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) {
      this.errorMessage = 'Please provide a response message';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.sendingResponse = true;
    this.complianceService.addTicketResponse(this.selectedTicket.ticketId, this.responseMessage).subscribe({
      next: (response) => {
        this.successMessage = 'Response sent successfully';
        this.ticketResponses.push(response);
        this.responseMessage = '';
        this.sendingResponse = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error sending response:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to send response. Please try again.';
        this.errorMessage = errorMsg;
        this.sendingResponse = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  submitStatusUpdate(): void {
    if (!this.selectedTicket || !this.newStatus) return;

    // Check if ticket is already CLOSED or RESOLVED
    if (this.isStatusLocked()) {
      this.toastService.error('Cannot change status of a closed or resolved ticket');
      return;
    }

    // Check if status actually changed
    if (this.newStatus === this.selectedTicket.status) {
      this.toastService.error('Please select a different status');
      return;
    }

    // If changing to RESOLVED, show resolution modal
    if (this.newStatus === 'RESOLVED') {
      this.showResolutionModal = true;
      return;
    }

    // For other status changes, proceed directly
    this.performStatusUpdate(this.newStatus);
  }

  performStatusUpdate(newStatus: string, resolution?: string): void {
    if (!this.selectedTicket) return;

    this.updatingStatus = true;
    this.complianceService.updateTicketStatus(this.selectedTicket.ticketId, newStatus, resolution).subscribe({
      next: (updatedTicket) => {
        this.toastService.success(`Ticket status updated to ${newStatus}`);
        this.selectedTicket = updatedTicket;
        this.newStatus = updatedTicket.status; // Update dropdown to new status
        this.loadTickets();
        this.updatingStatus = false;
        this.showResolutionModal = false;
        this.resolutionText = '';
      },
      error: (error) => {
        console.error('Error updating status:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to update status. Please try again.';
        this.errorMessage = errorMsg;
        this.updatingStatus = false;
        // Revert the status change in UI
        if (this.selectedTicket) {
          const originalTicket = this.tickets.find(t => t.ticketId === this.selectedTicket!.ticketId);
          if (originalTicket) {
            this.selectedTicket.status = originalTicket.status;
          }
        }
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  submitResolution(): void {
    if (!this.resolutionText.trim()) {
      this.toastService.error('Please enter a resolution message');
      return;
    }
    this.performStatusUpdate('RESOLVED', this.resolutionText);
  }

  closeResolutionModal(): void {
    this.showResolutionModal = false;
    this.resolutionText = '';
  }

  updatePriority(newPriority: string): void {
    if (!this.selectedTicket) return;

    this.updatingPriority = true;
    this.complianceService.updateTicketPriority(this.selectedTicket.ticketId, newPriority).subscribe({
      next: (updatedTicket) => {
        this.toastService.success(`Ticket priority updated to ${newPriority}`);
        this.selectedTicket = updatedTicket;
        this.loadTickets();
        this.updatingPriority = false;
      },
      error: (error) => {
        console.error('Error updating priority:', error);
        this.toastService.error(error.error?.message || 'Failed to update priority');
        this.updatingPriority = false;
        // Revert the priority change in UI
        if (this.selectedTicket) {
          const originalTicket = this.tickets.find(t => t.ticketId === this.selectedTicket!.ticketId);
          if (originalTicket) {
            this.selectedTicket.priority = originalTicket.priority;
          }
        }
      }
    });
  }

  resolveTicket(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) {
      this.errorMessage = 'Please provide a resolution message';
      return;
    }

    if (confirm('Mark this ticket as resolved?')) {
      this.complianceService.resolveTicket(this.selectedTicket.ticketId, this.responseMessage).subscribe({
        next: (updatedTicket) => {
          this.successMessage = 'Ticket resolved successfully';
          this.selectedTicket = updatedTicket;
          this.loadTickets();
          this.closeTicketModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error resolving ticket:', error);
          this.errorMessage = 'Failed to resolve ticket';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'IN_PROGRESS': 'status-in-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-open';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: any = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'URGENT': 'priority-urgent'
    };
    return priorityMap[priority] || 'priority-medium';
  }

  getTicketCount(status: string): number {
    if (status === 'all') return this.tickets.length;
    return this.tickets.filter(t => t.status === status).length;
  }

  // Format ticket description for better display
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
      // Alert Details Section
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
            formatted += `<div class="detail-item"><span class="label">${label}:</span><span class="value">${value}</span></div>`;
          }
        }
        formatted += '</div></div>';
      }
      // Customer Message Section - Highlighted
      else if (section.startsWith('CUSTOMER MESSAGE:')) {
        formatted += '<div class="customer-message">';
        formatted += '<h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Customer Message</h4>';
        const message = section.replace('CUSTOMER MESSAGE:', '').trim();
        formatted += `<p class="message-content">${message}</p>`;
        formatted += '</div>';
      }
      // Action Required Section
      else if (section.startsWith('ACTION REQUIRED:')) {
        formatted += '<div class="action-required">';
        formatted += '<h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Action Required</h4>';
        const action = section.replace('ACTION REQUIRED:', '').trim();
        formatted += `<p>${action}</p>`;
        formatted += '</div>';
      }
    }
    
    return formatted;
  }
}
