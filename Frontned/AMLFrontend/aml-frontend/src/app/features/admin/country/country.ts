import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CountryService } from '../../../core/services/country.service';
import { Country as CountryModel, CountryCreateRequest, CountryUpdateRequest } from '../../../core/models/country.models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './country.html',
  styleUrl: './country.css',
})
export class Country implements OnInit {
  countries: CountryModel[] = [];
  filteredCountries: CountryModel[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Statistics
  totalCountries: number = 0;
  
  // Filter states
  riskFilter: string = 'all';
  
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
  newCountry: CountryCreateRequest = {
    code: '',
    name: '',
    riskLevel: 'MEDIUM'
  };
  
  editCountry: CountryUpdateRequest = {};
  selectedCountry: CountryModel | null = null;
  
  // Form validation
  formErrors: any = {};
  isSubmitting: boolean = false;

  constructor(
    private countryService: CountryService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  // Load countries from API
  loadCountries(): void {
    this.loading = true;
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.updateStatistics();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.loading = false;
        this.countries = [];
        this.filteredCountries = [];
        
        let errorMessage = 'Failed to load countries. ';
        if (error.status === 0) {
          errorMessage += 'Please check if the backend server is running.';
        } else if (error.status === 401) {
          errorMessage += 'Please login again.';
        } else if (error.status === 403) {
          errorMessage += 'You do not have permission to view countries.';
        } else if (error.status === 404) {
          errorMessage += 'Countries endpoint not found.';
        } else {
          errorMessage += `Server error: ${error.status}`;
        }
        
        this.showErrorMessage(errorMessage);
      }
    });
  }

  // Update statistics
  updateStatistics(): void {
    this.totalCountries = this.countries.length;
  }

  // Search and filter functionality
  onSearchChange(): void {
    this.applyFilters();
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.countries];
    
    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(country =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower)
      );
    }
    
    // Risk level filter
    if (this.riskFilter !== 'all') {
      filtered = filtered.filter(country => country.riskLevel === this.riskFilter);
    }
    
    this.filteredCountries = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  // Pagination methods
  getPaginatedCountries(): CountryModel[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredCountries.slice(startIndex, endIndex);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.filteredCountries.length / this.pageSize);
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
    this.newCountry = {
      code: '',
      name: '',
      riskLevel: 'MEDIUM'
    };
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.editCountry = {
      code: country.code,
      name: country.name,
      riskLevel: country.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    };
    this.formErrors = {};
    this.showEditModal = true;
  }

  openEditFromView(country: CountryModel): void {
    // Close view modal first
    this.showViewModal = false;
    // Small delay to ensure smooth transition
    setTimeout(() => {
      this.openEditModal(country);
    }, 100);
  }

  openViewModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.showViewModal = true;
  }

  openDeleteModal(country: CountryModel): void {
    this.selectedCountry = country;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedCountry = null;
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createCountry(): void {
    // Clean and validate the data
    this.newCountry.code = this.newCountry.code?.trim().toUpperCase() || '';
    this.newCountry.name = this.newCountry.name?.trim() || '';
    
    if (!this.validateCountryForm(this.newCountry)) {
      return;
    }

    this.isSubmitting = true;
    this.countryService.createCountry(this.newCountry).subscribe({
      next: (country) => {
        this.countries.push(country);
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Country created successfully');
      },
      error: (error) => {
        console.error('Error creating country:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to create country: ${errorMsg}`);
      }
    });
  }

  updateCountry(): void {
    if (!this.selectedCountry) {
      return;
    }
    
    // Clean and validate the data
    this.editCountry.code = this.editCountry.code?.trim().toUpperCase() || '';
    this.editCountry.name = this.editCountry.name?.trim() || '';
    
    if (!this.validateCountryForm(this.editCountry)) {
      return;
    }

    this.isSubmitting = true;
    this.countryService.updateCountry(this.selectedCountry.code, this.editCountry).subscribe({
      next: (updatedCountry) => {
        const index = this.countries.findIndex(c => c.code === updatedCountry.code);
        if (index !== -1) {
          this.countries[index] = updatedCountry;
        }
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Country updated successfully');
      },
      error: (error) => {
        console.error('Error updating country:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to update country: ${errorMsg}`);
      }
    });
  }

  deleteCountry(): void {
    if (!this.selectedCountry) return;

    // Show confirmation dialog
    this.confirmationService.confirm({
      title: 'Delete Country',
      message: `Are you sure you want to delete "${this.selectedCountry.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) {
        this.closeModals();
        return;
      }

      this.isSubmitting = true;
      this.countryService.deleteCountry(this.selectedCountry!.code).subscribe({
        next: () => {
          this.countries = this.countries.filter(c => c.code !== this.selectedCountry!.code);
          this.updateStatistics();
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Country deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting country:', error);
          this.isSubmitting = false;
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.showErrorMessage(`Failed to delete country: ${errorMsg}`);
        }
      });
    });
  }


  // Form validation
  validateCountryForm(country: any): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!country.code || country.code.trim().length === 0) {
      this.formErrors.code = 'Country code is required';
      isValid = false;
    } else if (country.code.length !== 2) {
      this.formErrors.code = 'Country code must be 2 characters';
      isValid = false;
    }

    if (!country.name || country.name.trim().length === 0) {
      this.formErrors.name = 'Country name is required';
      isValid = false;
    }

    if (!country.riskLevel) {
      this.formErrors.riskLevel = 'Risk level is required';
      isValid = false;
    }

    return isValid;
  }

  // Utility methods
  getRiskBadgeClass(riskLevel?: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return 'risk-badge critical';
      case 'HIGH': return 'risk-badge high';
      case 'MEDIUM': return 'risk-badge medium';
      case 'LOW': return 'risk-badge low';
      default: return 'risk-badge medium';
    }
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
