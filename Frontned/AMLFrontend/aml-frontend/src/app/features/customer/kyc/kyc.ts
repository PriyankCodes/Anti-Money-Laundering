import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KycService } from '../../../core/services/kyc.service';
import { CustomerProfileService } from '../../../core/services/customer-profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  KycDocument, 
  KycDocumentSummary, 
  KycStatusSummary, 
  DocumentType, 
  KycStatus 
} from '../../../core/models/kyc.models';

@Component({
  selector: 'app-kyc',
  templateUrl: './kyc.html',
  styleUrls: ['./kyc.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class KycComponent implements OnInit {
  // Data properties
  documents: KycDocumentSummary[] = [];
  kycStatus: KycStatusSummary | null = null;
  selectedDocument: KycDocument | null = null;
  
  // UI state
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';
  showUploadModal = false;
  showDocumentModal = false;
  
  // Upload form
  uploadForm = {
    documentType: DocumentType.PASSPORT,
    file: null as File | null,
    documentNumber: ''
  };
  
  // Filter and search
  searchTerm = '';
  selectedStatus = 'All';
  selectedDocumentType = 'All';
  filteredDocuments: KycDocumentSummary[] = [];
  
  // Constants
  documentTypes = Object.values(DocumentType);
  statusOptions = Object.values(KycStatus);
  
  // Current customer ID (for KYC operations)
  currentUserId: number = 0;

  constructor(
    private kycService: KycService,
    private customerProfileService: CustomerProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUserId();
  }

  // Get current customer ID using AuthService
  getCurrentUserId(): void {
    // Use AuthService to get customer ID from JWT token
    const customerId = this.authService.getUserIdFromToken();
    
    if (customerId) {
      this.currentUserId = customerId;
      console.log('Customer ID from token:', this.currentUserId);
      this.loadKycData();
    } else {
      console.warn('Unable to get customer ID from token, attempting to fetch from backend');
      // Try to fetch from backend profile
      const email = localStorage.getItem('email');
      if (email) {
        this.fetchCustomerIdFromBackend(email);
      } else {
        this.errorMessage = 'Authentication error. Please log in again.';
      }
    }
  }

  // Fetch customer ID from backend using profile API
  fetchCustomerIdFromBackend(email: string): void {
    console.log('Fetching customer profile from backend to get customer ID...');
    this.isLoading = true;
    
    this.customerProfileService.getProfile().subscribe({
      next: (profile) => {
        console.log('Customer profile fetched:', profile);
        if (profile.customerId) {
          this.currentUserId = profile.customerId;
          // Store it in localStorage for future use
          localStorage.setItem('customerId', profile.customerId.toString());
          console.log('Customer ID stored:', profile.customerId);
          // Now load KYC data
          this.loadKycData();
        } else {
          console.error('Customer ID not found in profile response');
          this.showCustomerIdError();
        }
      },
      error: (error) => {
        console.error('Error fetching customer profile:', error);
        this.showCustomerIdError();
      }
    });
  }

  // Show error message when customer ID cannot be retrieved
  showCustomerIdError(): void {
    this.errorMessage = `
      <div style="text-align: left;">
        <strong>Unable to retrieve Customer ID.</strong><br><br>
        <strong>Quick Fix:</strong><br>
        1. Open browser console (F12)<br>
        2. Run this command:<br>
        <code style="background: #f5f5f5; padding: 4px; display: block; margin: 8px 0;">localStorage.setItem('customerId', 'YOUR_CUSTOMER_ID');</code>
        3. Refresh the page<br><br>
        <small>Replace 'YOUR_CUSTOMER_ID' with your actual customer ID.</small><br><br>
        <strong>Or:</strong><br>
        Try logging out and logging in again.
      </div>
    `;
    this.isLoading = false;
  }

  loadKycData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load KYC status and documents
    Promise.all([
      this.kycService.getCustomerKycStatus(this.currentUserId).toPromise(),
      this.kycService.getCustomerDocuments(this.currentUserId).toPromise()
    ]).then(([status, documents]) => {
      this.kycStatus = status!;
      this.documents = documents!;
      
      // Debug: Log documents to check filePath
      console.log('Loaded documents:', this.documents);
      this.documents.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, {
          id: doc.id,
          fileName: doc.fileName,
          filePath: doc.filePath,
          documentType: doc.documentType
        });
      });
      
      this.applyFilters();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading KYC data:', error);
      this.errorMessage = 'Failed to load KYC data. Please try again.';
      this.isLoading = false;
    });
  }

  // File upload handling
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.errorMessage = '';
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 10MB. Please select a smaller file.';
        event.target.value = ''; // Reset file input
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!allowedTypes.includes(file.type) && !hasValidExtension) {
        this.errorMessage = 'Only JPEG, PNG, and PDF files are allowed. Please select a valid file.';
        event.target.value = ''; // Reset file input
        return;
      }
      
      // Validate minimum file size (at least 1KB to avoid empty files)
      if (file.size < 1024) {
        this.errorMessage = 'File is too small. Please select a valid document.';
        event.target.value = ''; // Reset file input
        return;
      }
      
      this.uploadForm.file = file;
      this.successMessage = `File "${file.name}" selected (${this.formatFileSize(file.size)})`;
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  uploadDocument(): void {
    // Validate all required fields
    if (!this.uploadForm.file) {
      this.errorMessage = 'Please select a file to upload';
      return;
    }
    
    if (!this.uploadForm.documentType) {
      this.errorMessage = 'Please select a document type';
      return;
    }
    
    // Validate document number if provided
    if (this.uploadForm.documentNumber && this.uploadForm.documentNumber.trim()) {
      const docNumber = this.uploadForm.documentNumber.trim();
      if (docNumber.length < 5) {
        this.errorMessage = 'Document number must be at least 5 characters';
        return;
      }
      if (docNumber.length > 50) {
        this.errorMessage = 'Document number must be less than 50 characters';
        return;
      }
      // Validate alphanumeric with optional hyphens and spaces
      if (!/^[A-Za-z0-9\s\-]+$/.test(docNumber)) {
        this.errorMessage = 'Document number can only contain letters, numbers, spaces, and hyphens';
        return;
      }
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.kycService.uploadDocument(
      this.currentUserId,
      this.uploadForm.documentType,
      this.uploadForm.file
    ).subscribe({
      next: (document) => {
        this.successMessage = 'Document uploaded successfully!';
        this.showUploadModal = false;
        this.resetUploadForm();
        this.loadKycData(); // Refresh data
        this.isUploading = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage = error.error?.message || 'Failed to upload document. Please try again.';
        this.isUploading = false;
      }
    });
  }
  
  // Helper to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  // Get document number error for live validation
  getDocumentNumberError(): string {
    const docNumber = this.uploadForm.documentNumber?.trim();
    if (!docNumber) return '';
    
    if (docNumber.length < 5) {
      return 'Document number must be at least 5 characters';
    }
    if (docNumber.length > 50) {
      return 'Document number must be less than 50 characters';
    }
    if (!/^[A-Za-z0-9\s\-]+$/.test(docNumber)) {
      return 'Only letters, numbers, spaces, and hyphens allowed';
    }
    return '';
  }

  resetUploadForm(): void {
    this.uploadForm = {
      documentType: DocumentType.PASSPORT,
      file: null,
      documentNumber: ''
    };
  }

  // Open document in new tab
  openDocument(filePath: string | undefined): void {
    console.log('openDocument called with filePath:', filePath);
    
    if (!filePath) {
      console.error('No file path provided');
      this.errorMessage = 'Document file path not available. The document may not have been uploaded correctly.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    // If filePath is relative, prepend the backend URL
    let documentUrl = filePath;
    if (!filePath.startsWith('http')) {
      // Assuming your backend serves files from /uploads or similar
      documentUrl = `http://localhost:8080${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    console.log('Attempting to open document URL:', documentUrl);
    
    try {
      // Open document in new tab
      const newWindow = window.open(documentUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Popup was blocked
        console.error('Popup blocked by browser');
        this.errorMessage = 'Popup blocked! Please allow popups for this site and try again.';
        setTimeout(() => this.errorMessage = '', 5000);
        
        // Fallback: try to open in same tab
        window.location.href = documentUrl;
      } else {
        console.log('Document opened successfully in new tab');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      this.errorMessage = 'Failed to open document. Please try again.';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  // Document viewing (details modal)
  viewDocument(documentId: number): void {
    this.kycService.getDocumentById(documentId).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.showDocumentModal = true;
      },
      error: (error) => {
        console.error('Error loading document:', error);
        this.errorMessage = 'Failed to load document details.';
      }
    });
  }

  // Filtering and search
  applyFilters(): void {
    let filtered = [...this.documents];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        this.kycService.getDocumentTypeDisplay(doc.documentType).toLowerCase().includes(term) ||
        doc.fileName.toLowerCase().includes(term) ||
        this.kycService.getStatusDisplay(doc.status).toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(doc => doc.status === this.selectedStatus);
    }

    // Document type filter
    if (this.selectedDocumentType !== 'All') {
      filtered = filtered.filter(doc => doc.documentType === this.selectedDocumentType);
    }

    // Sort by upload date (newest first)
    filtered.sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());

    this.filteredDocuments = filtered;
  }

  // Modal controls
  openUploadModal(): void {
    this.showUploadModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetUploadForm();
    this.errorMessage = '';
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
    this.selectedDocument = null;
  }

  // Utility methods
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDocumentTypeDisplay(type: DocumentType): string {
    return this.kycService.getDocumentTypeDisplay(type);
  }

  getStatusDisplay(status: KycStatus): string {
    return this.kycService.getStatusDisplay(status);
  }

  getStatusClass(status: KycStatus): string {
    return this.kycService.getStatusClass(status);
  }

  getRiskScoreClass(riskScore?: number): string {
    return this.kycService.getRiskScoreClass(riskScore);
  }

  getProgressPercentage(): number {
    if (!this.kycStatus) return 0;
    return Math.round((this.kycStatus.verifiedDocuments / Math.max(this.kycStatus.totalDocuments, 1)) * 100);
  }

  getRequiredDocuments(): DocumentType[] {
    // Define required documents for KYC completion (at least one should be verified)
    return [
      DocumentType.PASSPORT,
      DocumentType.PAN,
      DocumentType.AADHAAR
    ];
  }

  getMissingDocuments(): DocumentType[] {
    const required = this.getRequiredDocuments();
    const uploaded = this.documents.map(doc => doc.documentType);
    return required.filter(type => !uploaded.includes(type));
  }

  isDocumentRequired(type: DocumentType): boolean {
    return this.getRequiredDocuments().includes(type);
  }
}

// Export for routing
export const Kyc = KycComponent;
