import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KycService } from '../../../core/services/kyc.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { 
  KycDocument, 
  KycStatus, 
  KycDocumentVerificationRequest,
  DocumentType 
} from '../../../core/models/kyc.models';

interface ReviewData {
  verificationNotes: string;
}

interface FilterOptions {
  status: string;
  documentType: string;
  customerSearch: string;
  uploadDate: string;
}

interface ActionModalData {
  isOpen: boolean;
  action: 'approve' | 'reject' | 'bulk-approve' | 'bulk-reject' | null;
  documentId?: number;
  notes: string;
}

interface DocumentDetailsModal {
  isOpen: boolean;
  document: KycDocument | null;
  customerDetails: any | null;
}

@Component({
  selector: 'app-kyc-review',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './kyc-review.html',
  styleUrl: './kyc-review.css',
})
export class KycReview implements OnInit {
  // Tab management
  activeTab: 'pending' | 'all' = 'pending';
  
  // Data
  kycDocuments: KycDocument[] = [];
  filteredDocuments: KycDocument[] = [];
  
  // Filter options
  filterOptions: FilterOptions = {
    status: 'ALL',
    documentType: 'ALL',
    customerSearch: '',
    uploadDate: ''
  };
  
  // Date validation
  dateError: string = '';

  // Modals
  actionModal: ActionModalData = {
    isOpen: false,
    action: null,
    notes: ''
  };
  
  documentDetailsModal: DocumentDetailsModal = {
    isOpen: false,
    document: null,
    customerDetails: null
  };

  kycStatuses = Object.values(KycStatus);
  documentTypes = Object.values(DocumentType);
  loading = false;
  selectedDocuments: number[] = [];
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  constructor(
    private router: Router,
    private kycService: KycService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPendingDocuments();
  }

  // Tab switching
  switchTab(tab: 'pending' | 'all'): void {
    this.activeTab = tab;
    this.selectedDocuments = [];
    this.filterOptions = {
      status: 'ALL',
      documentType: 'ALL',
      customerSearch: '',
      uploadDate: ''
    };
    this.dateError = '';
    
    if (tab === 'pending') {
      this.loadPendingDocuments();
    } else {
      this.loadAllDocuments();
    }
  }

  loadPendingDocuments(): void {
    this.loading = true;
    this.kycService.getPendingDocuments().subscribe({
      next: (documents) => {
        this.kycDocuments = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pending documents:', error);
        this.toastService.error('Failed to load pending documents. Please try again.');
        this.loading = false;
      }
    });
  }

  loadAllDocuments(): void {
    this.loading = true;
    this.kycService.getAllDocuments().subscribe({
      next: (documents) => {
        this.kycDocuments = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading KYC documents:', error);
        this.toastService.error('Failed to load KYC documents. Please try again.');
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    if (this.activeTab === 'pending') {
      this.loadPendingDocuments();
    } else {
      this.loadAllDocuments();
    }
  }

  loadDocumentsByStatus(status: KycStatus): void {
    this.loading = true;
    this.kycService.getDocumentsByStatus(status).subscribe({
      next: (documents) => {
        this.kycDocuments = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading documents by status:', error);
        this.toastService.error('Failed to load documents. Please try again.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    // Validate upload date first
    if (!this.validateUploadDate()) {
      return;
    }
    
    let filtered = [...this.kycDocuments];

    // Filter by status
    if (this.filterOptions.status !== 'ALL') {
      filtered = filtered.filter(doc => doc.status === this.filterOptions.status);
    }

    // Filter by document type
    if (this.filterOptions.documentType !== 'ALL') {
      filtered = filtered.filter(doc => doc.documentType === this.filterOptions.documentType);
    }

    // Filter by customer search
    if (this.filterOptions.customerSearch.trim()) {
      const searchTerm = this.filterOptions.customerSearch.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.customerName.toLowerCase().includes(searchTerm) ||
        doc.fileName.toLowerCase().includes(searchTerm) ||
        doc.id.toString().includes(searchTerm)
      );
    }

    // Filter by upload date (for pending tab)
    if (this.filterOptions.uploadDate && this.activeTab === 'pending') {
      const selectedDate = new Date(this.filterOptions.uploadDate);
      selectedDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(doc => {
        const uploadDate = new Date(doc.uploadTimestamp);
        uploadDate.setHours(0, 0, 0, 0);
        return uploadDate.getTime() === selectedDate.getTime();
      });
    }

    this.filteredDocuments = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  // Pagination methods
  getPaginatedDocuments(): KycDocument[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredDocuments.slice(startIndex, endIndex);
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // Reset to first page
  }

  onFilterChange(): void {
    this.applyFilters();
  }
  
  onDateChange(): void {
    this.dateError = '';
  }
  
  validateUploadDate(): boolean {
    this.dateError = '';
    
    if (this.filterOptions.uploadDate) {
      const selectedDate = new Date(this.filterOptions.uploadDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        this.dateError = 'Upload date cannot be in the future';
        return false;
      }
    }
    
    return true;
  }
  
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onStatusFilterChange(): void {
    if (this.filterOptions.status === 'ALL') {
      this.loadAllDocuments();
    } else {
      this.loadDocumentsByStatus(this.filterOptions.status as KycStatus);
    }
  }

  setActiveTab(tab: string, event: Event): void {
    event.preventDefault();
    
    const routes: { [key: string]: string } = {
      'dashboard': '/admin/dashboard',
      'kyc-review': '/admin/kyc-review',
      'transactions': '/admin/transactions',
      'rules': '/admin/rules',
      'users': '/admin/users',
      'keywords': '/admin/keywords',
      'countries': '/admin/countries',
      'audit-logs': '/admin/audit-logs',
      'reports': '/admin/reports'
    };
    
    if (routes[tab]) {
      this.router.navigate([routes[tab]]);
    }
  }

  // Open action modal
  openActionModal(action: 'approve' | 'reject', documentId: number): void {
    this.actionModal = {
      isOpen: true,
      action: action,
      documentId: documentId,
      notes: ''
    };
  }

  openBulkActionModal(action: 'bulk-approve' | 'bulk-reject'): void {
    if (this.selectedDocuments.length === 0) {
      this.toastService.warning('Please select documents first.');
      return;
    }
    this.actionModal = {
      isOpen: true,
      action: action,
      notes: ''
    };
  }

  closeActionModal(): void {
    this.actionModal = {
      isOpen: false,
      action: null,
      notes: ''
    };
  }

  // Execute action from modal
  executeAction(): void {
    const { action, documentId, notes } = this.actionModal;
    
    if (action === 'approve' && documentId) {
      this.updateDocumentStatus(
        this.kycDocuments.find(d => d.id === documentId)!,
        KycStatus.VERIFIED,
        notes || 'Document verified successfully'
      );
    } else if (action === 'reject' && documentId) {
      if (!notes.trim()) {
        this.toastService.warning('Please provide notes for rejection.');
        return;
      }
      this.updateDocumentStatus(
        this.kycDocuments.find(d => d.id === documentId)!,
        KycStatus.REJECTED,
        notes
      );
    } else if (action === 'bulk-approve') {
      this.processBulkAction(KycStatus.VERIFIED, notes || 'Bulk verification completed');
    } else if (action === 'bulk-reject') {
      if (!notes.trim()) {
        this.toastService.warning('Please provide notes for bulk rejection.');
        return;
      }
      this.processBulkAction(KycStatus.REJECTED, notes);
    }
    
    this.closeActionModal();
  }


  updateDocumentStatus(doc: KycDocument, status: KycStatus, notes: string): void {
    const request: KycDocumentVerificationRequest = {
      documentId: doc.id,
      status: status,
      verificationNotes: notes
    };

    this.kycService.verifyDocument(request).subscribe({
      next: () => {
        const statusText = status === KycStatus.VERIFIED ? 'verified' : 'rejected';
        this.toastService.success(`Document #${doc.id} has been ${statusText} successfully.`);
        this.refreshData();
      },
      error: (error) => {
        console.error('Error updating document status:', error);
        this.toastService.error('Failed to update document status. Please try again.');
      }
    });
  }

  // Bulk operations
  toggleDocumentSelection(docId: number): void {
    const index = this.selectedDocuments.indexOf(docId);
    if (index > -1) {
      this.selectedDocuments.splice(index, 1);
    } else {
      this.selectedDocuments.push(docId);
    }
  }

  selectAllDocuments(): void {
    if (this.selectedDocuments.length === this.filteredDocuments.length) {
      this.selectedDocuments = [];
    } else {
      this.selectedDocuments = this.filteredDocuments.map(doc => doc.id);
    }
  }

  // Document details modal
  openDocumentDetailsModal(doc: KycDocument): void {
    this.documentDetailsModal = {
      isOpen: true,
      document: doc,
      customerDetails: {
        customerId: doc.customerId,
        customerName: doc.customerName,
        email: doc.email || 'N/A',
        phone: doc.contactNumber || 'N/A',
        kycStatus: doc.status
      }
    };
  }

  closeDocumentDetailsModal(): void {
    this.documentDetailsModal = {
      isOpen: false,
      document: null,
      customerDetails: null
    };
  }

  // Open document link in new tab
  openDocumentLink(filePath: string): void {
    window.open(filePath, '_blank');
  }

  // Get document URL (prefer fileUrl over filePath)
  getDocumentUrl(doc: KycDocument): string | null {
    return doc.fileUrl || doc.filePath || null;
  }

  processBulkAction(status: KycStatus, notes: string): void {
    const promises = this.selectedDocuments.map(docId => {
      const request: KycDocumentVerificationRequest = {
        documentId: docId,
        status: status,
        verificationNotes: notes
      };
      return this.kycService.verifyDocument(request).toPromise();
    });

    Promise.all(promises).then(() => {
      const statusText = status === KycStatus.VERIFIED ? 'verified' : 'rejected';
      this.toastService.success(`${this.selectedDocuments.length} documents have been ${statusText} successfully.`);
      this.selectedDocuments = [];
      this.refreshData();
    }).catch(error => {
      console.error('Error in bulk operation:', error);
      this.toastService.error('Some documents failed to update. Please try again.');
    });
  }

  // Clear all filters
  clearFilters(): void {
    this.filterOptions = {
      status: 'ALL',
      documentType: 'ALL',
      customerSearch: '',
      uploadDate: ''
    };
    this.dateError = '';
    this.applyFilters();
  }

  // Utility methods
  getStatusDisplay(status: KycStatus): string {
    return this.kycService.getStatusDisplay(status);
  }

  getStatusClass(status: KycStatus): string {
    return this.kycService.getStatusClass(status);
  }

  getDocumentTypeDisplay(type: DocumentType): string {
    return this.kycService.getDocumentTypeDisplay(type);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  canPerformAction(doc: KycDocument, action: string): boolean {
    switch (action) {
      case 'verify':
        return doc.status === KycStatus.PENDING;
      case 'reject':
        return doc.status === KycStatus.PENDING;
      default:
        return false;
    }
  }

  trackByDocId(index: number, doc: KycDocument): number {
    return doc.id;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }
}
