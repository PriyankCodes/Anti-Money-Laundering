import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Transaction as ComplianceTransaction } from '../../../core/services/compliance.service';

// Use ComplianceTransaction type
type Transaction = ComplianceTransaction;

interface PagedResponse {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.css']
})
export class Transactions implements OnInit {
  Math = Math; // Expose Math to template
  allTransactions: Transaction[] = [];
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Modal
  showDetailsModal = false;
  selectedTransaction: Transaction | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  
  // Filters
  searchQuery = '';
  filterType = 'all';
  filterStatus = 'all';
  sortBy = 'timestamp';
  sortOrder = 'desc';

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.complianceService.getAllTransactions(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        // Backend returns array directly, not PagedResponse
        if (Array.isArray(response)) {
          this.allTransactions = response;
          this.totalElements = response.length;
          // Client-side pagination
          this.totalPages = Math.ceil(this.totalElements / this.pageSize);
        } else {
          this.allTransactions = [];
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allTransactions];
    
    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === this.filterType);
    }
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.transactionId.toString().includes(query) ||
        t.customerName?.toLowerCase().includes(query) ||
        t.customerEmail?.toLowerCase().includes(query) ||
        t.senderAccountNumber?.toLowerCase().includes(query) ||
        t.counterpartyAccount?.toLowerCase().includes(query) ||
        t.counterpartyName?.toLowerCase().includes(query)
      );
    }
    
    this.filteredTransactions = filtered;
    this.totalElements = filtered.length;
    this.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.applyFilters();
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

  getStatusClass(status: string): string {
    const statusMap: any = {
      'COMPLETED': 'status-completed',
      'PENDING': 'status-pending',
      'BLOCKED': 'status-failed',
      'FLAGGED': 'status-flagged'
    };
    return statusMap[status] || 'status-pending';
  }

  getTypeClass(type: string): string {
    const typeMap: any = {
      'TRANSFER': 'type-transfer',
      'DEPOSIT': 'type-deposit',
      'WITHDRAWAL': 'type-withdrawal'
    };
    return typeMap[type] || 'type-transfer';
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

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }
}
