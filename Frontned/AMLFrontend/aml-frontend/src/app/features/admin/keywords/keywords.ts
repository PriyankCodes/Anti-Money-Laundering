import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeywordService } from '../../../core/services/keyword.service';
import { Keyword, KeywordCreateRequest, KeywordUpdateRequest } from '../../../core/models/keyword.models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-keywords',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './keywords.html',
  styleUrl: './keywords.css',
})
export class Keywords implements OnInit {
  keywords: Keyword[] = [];
  filteredKeywords: Keyword[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Statistics
  totalKeywords: number = 0;
  activeKeywords: number = 0;
  inactiveKeywords: number = 0;
  
  // Filter states
  categoryFilter: string = 'all';
  statusFilter: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  
  // Modal states
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  
  // Form data
  newKeyword: KeywordCreateRequest = {
    keyword: '',
    category: 'OTHER',
    severity: 50,
    description: ''
  };
  
  editKeyword: KeywordUpdateRequest = {};
  selectedKeyword: Keyword | null = null;
  
  // Form validation
  formErrors: any = {};
  isSubmitting: boolean = false;

  // Category and risk level options
  categories = [
    { value: 'TERRORISM', label: 'Terrorism' },
    { value: 'MONEY_LAUNDERING', label: 'Money Laundering' },
    { value: 'DRUG_TRAFFICKING', label: 'Drug Trafficking' },
    { value: 'FRAUD', label: 'Fraud' },
    { value: 'SANCTIONS', label: 'Sanctions' },
    { value: 'OTHER', label: 'Other' }
  ];

  severityLevels = Array.from({length: 100}, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  constructor(
    private keywordService: KeywordService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadKeywords();
  }

  // Load keywords from API
  loadKeywords(): void {
    this.loading = true;
    this.keywordService.getKeywords().subscribe({
      next: (keywords) => {
        this.keywords = keywords;
        this.updateStatistics();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading keywords:', error);
        this.loading = false;
      }
    });
  }

  // Update statistics
  updateStatistics(): void {
    this.totalKeywords = this.keywords.length;
    this.activeKeywords = this.keywords.filter(k => k.isActive).length;
    this.inactiveKeywords = this.keywords.filter(k => !k.isActive).length;
  }

  // Search and filter functionality
  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.keywords];

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(keyword =>
        keyword.keyword.toLowerCase().includes(searchLower) ||
        keyword.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(keyword => keyword.category === this.categoryFilter);
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(keyword => keyword.isActive === isActive);
    }

    this.filteredKeywords = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  // Pagination methods
  getPaginatedKeywords(): Keyword[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredKeywords.slice(startIndex, endIndex);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.filteredKeywords.length / this.pageSize);
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

  // Modal management
  openAddModal(): void {
    this.newKeyword = {
      keyword: '',
      category: 'OTHER',
      severity: 50,
      description: ''
    };
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(keyword: Keyword): void {
    this.selectedKeyword = keyword;
    this.editKeyword = {
      keyword: keyword.keyword,
      category: keyword.category,
      severity: keyword.severity,
      description: keyword.description,
      isActive: keyword.isActive
    };
    this.formErrors = {};
    this.showEditModal = true;
  }

  openEditFromView(keyword: Keyword): void {
    // Close view modal first
    this.showViewModal = false;
    // Small delay to ensure smooth transition
    setTimeout(() => {
      this.openEditModal(keyword);
    }, 100);
  }

  openViewModal(keyword: Keyword): void {
    this.selectedKeyword = keyword;
    this.showViewModal = true;
  }

  openDeleteModal(keyword: Keyword): void {
    this.selectedKeyword = keyword;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedKeyword = null;
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createKeyword(): void {
    if (!this.validateKeywordForm(this.newKeyword)) {
      return;
    }

    this.isSubmitting = true;
    this.keywordService.createKeyword(this.newKeyword).subscribe({
      next: (keyword) => {
        this.keywords.push(keyword);
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Keyword created successfully');
      },
      error: (error) => {
        console.error('Error creating keyword:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Failed to create keyword';
        this.showErrorMessage(`Failed to create keyword: ${errorMsg}`);
      }
    });
  }

  updateKeyword(): void {
    if (!this.selectedKeyword || !this.validateKeywordForm(this.editKeyword)) {
      return;
    }

    this.isSubmitting = true;
    this.keywordService.updateKeyword(this.selectedKeyword.id!, this.editKeyword).subscribe({
      next: (updatedKeyword) => {
        const index = this.keywords.findIndex(k => k.id === updatedKeyword.id);
        if (index !== -1) {
          this.keywords[index] = updatedKeyword;
          this.updateStatistics();
          this.applyFilters();
        }
        this.closeModals();
        this.showSuccessMessage('Keyword updated successfully');
      },
      error: (error) => {
        console.error('Error updating keyword:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Failed to update keyword';
        this.showErrorMessage(`Failed to update keyword: ${errorMsg}`);
      }
    });
  }

  deleteKeyword(): void {
    if (!this.selectedKeyword) return;

    // Show confirmation dialog
    this.confirmationService.confirm({
      title: 'Delete Keyword',
      message: `Are you sure you want to delete the keyword "${this.selectedKeyword.keyword}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) {
        this.closeModals();
        return;
      }

      this.isSubmitting = true;
      this.keywordService.deleteKeyword(this.selectedKeyword!.id!).subscribe({
        next: () => {
          this.keywords = this.keywords.filter(k => k.id !== this.selectedKeyword!.id);
          this.updateStatistics();
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Keyword deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting keyword:', error);
          this.isSubmitting = false;
          const errorMsg = error.error?.message || error.message || 'Failed to delete keyword';
          this.showErrorMessage(`Failed to delete keyword: ${errorMsg}`);
        }
      });
    });
  }

  toggleKeywordStatus(keyword: Keyword): void {
    const newStatus = !keyword.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    // Show confirmation dialog
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Keyword`,
      message: `Are you sure you want to ${action} the keyword "${keyword.keyword}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: newStatus ? 'info' : 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      
      // Use update endpoint with all data, just changing status
      const updatedKeywordData = {
        ...keyword,
        isActive: newStatus
      };
      
      this.keywordService.updateKeyword(keyword.id!, updatedKeywordData).subscribe({
        next: (updatedKeyword) => {
          const index = this.keywords.findIndex(k => k.id === updatedKeyword.id);
          if (index !== -1) {
            this.keywords[index] = updatedKeyword;
            this.updateStatistics();
            this.applyFilters();
          }
          this.showSuccessMessage(`Keyword ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (error) => {
          console.error('Error updating keyword status:', error);
          const errorMsg = error.error?.message || error.message || 'Failed to update keyword status';
          this.showErrorMessage(`Failed to update keyword status: ${errorMsg}`);
        }
      });
    });
  }

  // Form validation
  validateKeywordForm(keyword: any): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!keyword.keyword || keyword.keyword.trim().length === 0) {
      this.formErrors.keyword = 'Keyword is required';
      isValid = false;
    }

    if (!keyword.category) {
      this.formErrors.category = 'Category is required';
      isValid = false;
    }

    if (keyword.severity === undefined || keyword.severity === null) {
      this.formErrors.severity = 'Severity level is required';
      isValid = false;
    } else if (keyword.severity < 1 || keyword.severity > 100) {
      this.formErrors.severity = 'Severity must be between 1 and 100';
      isValid = false;
    }

    return isValid;
  }

  // Utility methods
  getSeverityBadgeClass(severity: number): string {
    if (severity >= 80) return 'severity-badge critical';
    if (severity >= 60) return 'severity-badge high';
    if (severity >= 40) return 'severity-badge medium';
    if (severity >= 20) return 'severity-badge low';
    return 'severity-badge very-low';
  }

  getSeverityLabel(severity: number): string {
    return severity.toString();
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'TERRORISM': return 'category-badge terrorism';
      case 'MONEY_LAUNDERING': return 'category-badge money-laundering';
      case 'DRUG_TRAFFICKING': return 'category-badge drug-trafficking';
      case 'FRAUD': return 'category-badge fraud';
      case 'SANCTIONS': return 'category-badge sanctions';
      case 'OTHER': return 'category-badge other';
      default: return 'category-badge other';
    }
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  showSuccessMessage(message: string): void {
    this.toastService.success(message);
  }

  showErrorMessage(message: string): void {
    this.toastService.error(message);
  }

  // Navigation methods
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

}
