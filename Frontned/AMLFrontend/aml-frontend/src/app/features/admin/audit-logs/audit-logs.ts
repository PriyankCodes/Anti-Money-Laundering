import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuditService } from '../../../core/services/audit.service';
import { 
  AuditLog, 
  AuditAction, 
  AuditResourceType, 
  AuditStatus,
  AuditLogFilters 
} from '../../../core/models/audit.models';

interface AuditLogModal {
  isOpen: boolean;
  log: AuditLog | null;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.css']
})
export class AuditLogsComponent implements OnInit {
  // Data
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  loading: boolean = false;

  // Filters
  filters: AuditLogFilters = {
    userSearch: '',
    action: 'ALL',
    resourceType: 'ALL',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'desc'
  };
  
  // Date validation
  dateError: string = '';

  // Enums for dropdowns
  actions: AuditAction[] = Object.values(AuditAction);
  resourceTypes: AuditResourceType[] = Object.values(AuditResourceType);
  statuses: AuditStatus[] = Object.values(AuditStatus);

  // Modal
  detailsModal: AuditLogModal = {
    isOpen: false,
    log: null
  };

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private auditService: AuditService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.auditService.getAllAuditLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    // Validate date range first
    if (!this.validateDateRange()) {
      return;
    }
    
    let filtered = [...this.auditLogs];

    // Filter by user search (username or userId)
    if (this.filters.userSearch.trim()) {
      const searchTerm = this.filters.userSearch.toLowerCase();
      filtered = filtered.filter(log => 
        (log.username && log.username.toLowerCase().includes(searchTerm)) ||
        (log.userId && log.userId.toString().includes(searchTerm))
      );
    }

    // Filter by action
    if (this.filters.action !== 'ALL') {
      filtered = filtered.filter(log => log.action === this.filters.action);
    }

    // Filter by resource type
    if (this.filters.resourceType !== 'ALL') {
      filtered = filtered.filter(log => log.resourceType === this.filters.resourceType);
    }

    // Filter by status
    if (this.filters.status !== 'ALL') {
      filtered = filtered.filter(log => log.status === this.filters.status);
    }

    // Filter by date range
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return this.filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    this.filteredLogs = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }
  
  onDateChange(): void {
    this.dateError = '';
  }
  
  validateDateRange(): boolean {
    this.dateError = '';
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Validate dateFrom is not in future
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      if (fromDate > today) {
        this.dateError = 'From date cannot be in the future';
        return false;
      }
    }
    
    // Validate dateTo is not in future
    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      if (toDate > today) {
        this.dateError = 'To date cannot be in the future';
        return false;
      }
    }
    
    // Validate dateFrom is before or equal to dateTo
    if (this.filters.dateFrom && this.filters.dateTo) {
      const fromDate = new Date(this.filters.dateFrom);
      const toDate = new Date(this.filters.dateTo);
      
      if (fromDate > toDate) {
        this.dateError = 'From date must be before or equal to To date';
        return false;
      }
    }
    
    return true;
  }
  
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  clearFilters(): void {
    this.filters = {
      userSearch: '',
      action: 'ALL',
      resourceType: 'ALL',
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'desc'
    };
    this.dateError = '';
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.filters.sortOrder = this.filters.sortOrder === 'desc' ? 'asc' : 'desc';
    this.applyFilters();
  }

  openDetailsModal(log: AuditLog): void {
    this.detailsModal = {
      isOpen: true,
      log: log
    };
  }

  closeDetailsModal(): void {
    this.detailsModal = {
      isOpen: false,
      log: null
    };
  }

  // Utility methods
  getActionDisplay(action: AuditAction): string {
    return this.auditService.getActionDisplay(action);
  }

  getResourceTypeDisplay(resourceType: AuditResourceType): string {
    return this.auditService.getResourceTypeDisplay(resourceType);
  }

  getStatusDisplay(status: AuditStatus): string {
    return this.auditService.getStatusDisplay(status);
  }

  getStatusClass(status: AuditStatus): string {
    return this.auditService.getStatusClass(status);
  }

  getActionClass(action: AuditAction): string {
    return this.auditService.getActionClass(action);
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  trackByLogId(index: number, log: AuditLog): number {
    return log.logId;
  }

  // Pagination methods
  getPaginatedLogs(): AuditLog[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredLogs.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const endIndex = this.currentPage * this.pageSize;
    return Math.min(endIndex, this.filteredLogs.length);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when page size changes
  }
}
