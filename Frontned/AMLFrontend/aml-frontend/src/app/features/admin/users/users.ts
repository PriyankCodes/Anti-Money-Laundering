import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  // Address fields
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  nationality?: string;
  dateOfBirth?: string;
}

interface ComplianceOfficer {
  officerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  activeTab: string = 'officers';
  customers: User[] = [];
  officers: ComplianceOfficer[] = [];
  filteredCustomers: User[] = [];
  filteredOfficers: ComplianceOfficer[] = [];
  
  customerSearchTerm: string = '';
  officerSearchTerm: string = '';
  
  // Filter states
  customerStatusFilter: string = 'all';
  officerStatusFilter: string = 'all';
  customerDateFilter: string = 'all';
  officerDateFilter: string = 'all';
  
  // Pagination
  customerCurrentPage: number = 1;
  customerPageSize: number = 10;
  officerCurrentPage: number = 1;
  officerPageSize: number = 10;
  
  loading: boolean = false;
  showAddOfficerModal: boolean = false;
  addingOfficer: boolean = false;
  
  newOfficer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  };
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    console.log('Users component: Initializing...');
    const token = localStorage.getItem('token');
    console.log('Users component: Token exists:', !!token);
    
    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    
    this.loadCustomers();
    this.loadOfficers();
  }

  // Tab Management
  switchTab(tabName: string): void {
    this.activeTab = tabName;
  }

  // Load Data Methods
  loadCustomers(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading customers with token:', token ? 'Token exists' : 'No token');

    // Try multiple endpoints to get customer data
    this.tryLoadCustomersFromMultipleEndpoints(headers);
  }

  private tryLoadCustomersFromMultipleEndpoints(headers: HttpHeaders): void {
    // First try the admin customers endpoint (has complete Customer entity data)
    this.http.get<any[]>(`${this.apiUrl}/admin/customers`, { headers })
      .subscribe({
        next: (customers) => {
          console.log('Admin customers endpoint data received:', customers);
          this.processCustomersResponse(customers);
        },
        error: (error) => {
          console.log('Admin customers endpoint failed, trying KYC endpoint:', error.status);
          // Try KYC compliance endpoint
          this.http.get<any>(`${this.apiUrl}/kyc/compliance/customers/status`, { headers })
            .subscribe({
              next: (response) => {
                console.log('KYC Customers data received:', response);
                this.processCustomersResponse(response);
              },
              error: (error) => {
                console.log('KYC endpoint failed, trying other endpoints:', error.status);
                // Try other alternative endpoints
                this.tryAlternativeCustomerEndpoints(headers);
              }
            });
        }
      });
  }

  private tryAlternativeCustomerEndpoints(headers: HttpHeaders): void {
    // Try direct users endpoint
    this.http.get<any[]>(`${this.apiUrl}/users`, { headers })
      .subscribe({
        next: (users) => {
          console.log('Users endpoint data received:', users);
          const customers = users.filter(user => user.role === 'CUSTOMER' || user.role === 'customer');
          this.processCustomersResponse(customers);
        },
        error: (error) => {
          console.error('All customer endpoints failed:', error);
          this.loading = false;
          this.customers = [];
          this.filteredCustomers = [];
          this.toastService.error('Failed to load customers. Please check your connection and try again.');
        }
      });
  }

  private processCustomersResponse(response: any): void {
    console.log('Processing customer response:', response);
    
    // Handle different response formats
    let customersData: any[] = [];
    if (Array.isArray(response)) {
      customersData = response;
    } else if (response && Array.isArray(response.content)) {
      customersData = response.content;
    } else if (response && Array.isArray(response.data)) {
      customersData = response.data;
    } else if (response && Array.isArray(response.customers)) {
      customersData = response.customers;
    } else if (response && Array.isArray(response.users)) {
      customersData = response.users;
    } else if (response && typeof response === 'object') {
      const keys = Object.keys(response);
      for (const key of keys) {
        if (Array.isArray(response[key])) {
          customersData = response[key];
          break;
        }
      }
    }
    
    console.log('Extracted customers data:', customersData);
    
    // Filter out invalid or incomplete records
    const validCustomers = customersData.filter(customer => {
      return customer && (customer.userId || customer.id || customer.customerId) &&
             (customer.firstName || customer.first_name || customer.name || customer.customerName || customer.email || customer.emailAddress);
    });
    
    this.customers = validCustomers.map(customer => {
      // Extract name parts
      let firstName = customer.firstName || customer.first_name || '';
      let lastName = customer.lastName || customer.last_name || '';
      
      // If no firstName/lastName but has name field, split it
      if (!firstName && !lastName && customer.name) {
        const nameParts = customer.name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // If no firstName/lastName but has customerName field, split it
      if (!firstName && !lastName && customer.customerName) {
        const nameParts = customer.customerName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // If still no name, try to extract from email
      if (!firstName && !lastName) {
        const email = customer.email || customer.emailAddress || customer.userEmail || '';
        if (email) {
          const emailParts = email.split('@')[0].split('.');
          firstName = emailParts[0] || 'User';
          lastName = emailParts.slice(1).join(' ') || '';
        }
      }
      
      // Final fallback
      if (!firstName) firstName = 'Customer';
      if (!lastName) lastName = `#${customer.userId || customer.id || customer.customerId || 'Unknown'}`;
      
      return {
        userId: customer.userId || customer.id || customer.customerId || Date.now(),
        firstName: firstName,
        lastName: lastName,
        email: customer.email || customer.emailAddress || customer.userEmail || '',
        phone: customer.contactNumber || customer.phone || customer.phoneNumber || customer.mobile || '',
        role: 'CUSTOMER',
        status: this.normalizeStatus(customer.accountStatus || customer.status || customer.userStatus || 'ACTIVE'),
        isActive: this.determineActiveStatus(customer),
        createdAt: customer.createdAt || customer.registrationDate || customer.dateCreated || new Date().toISOString(),
        lastLogin: customer.lastLogin || customer.lastLoginDate,
        // Address fields
        street: customer.street || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        pincode: customer.pincode || '',
        nationality: customer.nationality || '',
        dateOfBirth: customer.dateOfBirth || ''
      };
    });
    
    this.filteredCustomers = [...this.customers];
    this.loading = false;
    console.log('Final processed customers:', this.customers);
  }

  loadOfficers(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Loading officers with token:', token ? 'Token exists' : 'No token');

    this.http.get<any[]>(`${this.apiUrl}/admin/officers`, { headers })
      .subscribe({
        next: (officers) => {
          console.log('Officers data received:', officers);
          this.officers = officers.map(officer => ({
            officerId: officer.officerId || officer.id || officer.userId,
            firstName: officer.firstName || officer.first_name || officer.name?.split(' ')[0] || 'Unknown',
            lastName: officer.lastName || officer.last_name || officer.name?.split(' ').slice(1).join(' ') || 'Officer',
            email: officer.email || officer.emailAddress || 'No email provided',
            phone: officer.phone || officer.phoneNumber || officer.mobile || 'No phone provided',
            employeeId: officer.employeeId || officer.employee_id || `EMP${officer.officerId || officer.id}`,
            department: officer.department || officer.dept || 'Compliance',
            isActive: officer.isActive !== false && officer.status !== 'INACTIVE' && officer.status !== 'SUSPENDED',
            createdAt: officer.createdAt || officer.dateCreated || new Date().toISOString()
          }));
          this.filteredOfficers = [...this.officers];
          console.log('Processed officers:', this.officers);
        },
        error: (error) => {
          console.error('Error loading officers:', error.status, error.message);
          this.officers = [];
          this.filteredOfficers = [];
          this.toastService.error('Failed to load officers. Please check your connection and try again.');
        }
      });
  }

  // Mock data methods removed - no fallback to mock data

  // Search and Filter Methods
  searchCustomers(): void {
    this.applyCustomerFilters();
  }
  
  applyCustomerFilters(): void {
    let filtered = [...this.customers];
    
    // Apply search filter
    if (this.customerSearchTerm.trim()) {
      const searchTerm = this.customerSearchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.userId.toString().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (this.customerStatusFilter !== 'all') {
      filtered = filtered.filter(customer => {
        switch (this.customerStatusFilter) {
          case 'active':
            return customer.isActive;
          case 'inactive':
            return !customer.isActive || customer.status === 'SUSPENDED' || customer.status === 'INACTIVE';
          case 'suspended':
            return customer.status === 'SUSPENDED';
          default:
            return true;
        }
      });
    }
    
    // Apply date filter
    if (this.customerDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(customer => {
        const createdDate = new Date(customer.createdAt);
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (this.customerDateFilter) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
    this.filteredCustomers = filtered;
  }
  
  onCustomerStatusFilterChange(): void {
    this.applyCustomerFilters();
  }
  
  onCustomerDateFilterChange(): void {
    this.applyCustomerFilters();
  }

  searchOfficers(): void {
    this.applyOfficerFilters();
  }
  
  applyOfficerFilters(): void {
    let filtered = [...this.officers];
    
    // Apply search filter
    if (this.officerSearchTerm.trim()) {
      const searchTerm = this.officerSearchTerm.toLowerCase();
      filtered = filtered.filter(officer => 
        officer.firstName.toLowerCase().includes(searchTerm) ||
        officer.lastName.toLowerCase().includes(searchTerm) ||
        officer.email.toLowerCase().includes(searchTerm) ||
        officer.phone.includes(searchTerm) ||
        officer.employeeId.toLowerCase().includes(searchTerm) ||
        officer.department.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (this.officerStatusFilter !== 'all') {
      filtered = filtered.filter(officer => {
        switch (this.officerStatusFilter) {
          case 'active':
            return officer.isActive;
          case 'inactive':
            return !officer.isActive;
          default:
            return true;
        }
      });
    }
    
    // Apply date filter
    if (this.officerDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(officer => {
        const createdDate = new Date(officer.createdAt);
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (this.officerDateFilter) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
    this.filteredOfficers = filtered;
  }
  
  onOfficerStatusFilterChange(): void {
    this.applyOfficerFilters();
  }
  
  onOfficerDateFilterChange(): void {
    this.applyOfficerFilters();
  }
  
  clearCustomerFilters(): void {
    this.customerSearchTerm = '';
    this.customerStatusFilter = 'all';
    this.customerDateFilter = 'all';
    this.applyCustomerFilters();
  }
  
  clearOfficerFilters(): void {
    this.officerSearchTerm = '';
    this.officerStatusFilter = 'all';
    this.officerDateFilter = 'all';
    this.applyOfficerFilters();
  }

  // Modal states - Only view modals, no edit modals
  showCustomerDetailsModal: boolean = false;
  showOfficerDetailsModal: boolean = false;
  
  viewingCustomer: User | null = null;
  viewingOfficer: ComplianceOfficer | null = null;

  // User Actions - Removed edit functionality
  // editUser method removed - only view and status change allowed
  
  viewCustomerDetails(user: User): void {
    this.viewingCustomer = user;
    this.showCustomerDetailsModal = true;
  }
  
  closeCustomerDetailsModal(): void {
    this.showCustomerDetailsModal = false;
    this.viewingCustomer = null;
  }
  
  // All edit-related methods removed - only view and status change allowed

  toggleUserStatus(user: User): void {
    const newStatus = user.isActive ? 'INACTIVE' : 'ACTIVE';
    const action = user.isActive ? 'suspend' : 'activate';

    // Show confirmation dialog
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Customer`,
      message: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: user.isActive ? 'warning' : 'info'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.tryUpdateUserStatus(user, newStatus, action, headers);
    });
  }
  
  private tryUpdateUserStatus(user: User, newStatus: string, action: string, headers: HttpHeaders): void {
    // Use the customer status endpoint
    const endpoint = `${this.apiUrl}/admin/customers/${user.userId}/status`;
    
    const payload = {
      status: newStatus
    };
    
    console.log(`Updating customer status via ${endpoint}`, payload);
    
    // Use PUT as per backend controller, expect text response
    this.http.put(endpoint, payload, { headers, responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Customer status updated successfully:', response);
        user.status = newStatus;
        user.isActive = newStatus === 'ACTIVE';
        this.toastService.success(`Customer ${action}d successfully!`);
        // Reload to ensure data is fresh
        this.loadCustomers();
      },
      error: (error) => {
        console.error(`Customer status update failed:`, error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        this.toastService.error(`Failed to ${action} customer: ${error.error?.message || error.message || 'Unknown error'}`);
      }
    });
  }
  
  private tryEndpointsSequentially(endpoints: string[], payloads: any[], user: User, newStatus: string, action: string, headers: HttpHeaders, index: number): void {
    if (index >= endpoints.length) {
      // All endpoints failed, try PATCH method
      this.tryPatchMethod(user, newStatus, action, headers);
      return;
    }
    
    const endpoint = endpoints[index];
    const payload = payloads[Math.min(index, payloads.length - 1)];
    
    console.log(`Trying endpoint ${index + 1}/${endpoints.length}: ${endpoint}`, payload);
    
    this.http.put(endpoint, payload, { headers }).subscribe({
      next: (response) => {
        console.log(`User ${action}d successfully via ${endpoint}:`, response);
        this.updateUserStatusLocally(user, newStatus);
        alert(`User ${action}d successfully!`);
      },
      error: (error) => {
        console.log(`Endpoint ${endpoint} failed:`, error.status, error.message);
        // Try next endpoint
        this.tryEndpointsSequentially(endpoints, payloads, user, newStatus, action, headers, index + 1);
      }
    });
  }
  
  private tryPatchMethod(user: User, newStatus: string, action: string, headers: HttpHeaders): void {
    const patchEndpoints = [
      `${this.apiUrl}/admin/customers/${user.userId}`,
      `${this.apiUrl}/admin/users/${user.userId}`,
      `${this.apiUrl}/users/${user.userId}`
    ];
    
    const patchPayload = {
      status: newStatus,
      isActive: newStatus === 'ACTIVE',
      accountStatus: newStatus
    };
    
    this.tryPatchEndpoints(patchEndpoints, patchPayload, user, newStatus, action, headers, 0);
  }
  
  private tryPatchEndpoints(endpoints: string[], payload: any, user: User, newStatus: string, action: string, headers: HttpHeaders, index: number): void {
    if (index >= endpoints.length) {
      // All methods failed
      console.error('All status update methods failed');
      this.toastService.error(`Failed to ${action} user. Please check your permissions or contact the administrator.`);
      return;
    }
    
    const endpoint = endpoints[index];
    console.log(`Trying PATCH endpoint ${index + 1}/${endpoints.length}: ${endpoint}`, payload);
    
    this.http.patch(endpoint, payload, { headers }).subscribe({
      next: (response) => {
        console.log(`User ${action}d successfully via PATCH ${endpoint}:`, response);
        this.updateUserStatusLocally(user, newStatus);
        alert(`User ${action}d successfully!`);
      },
      error: (error) => {
        console.log(`PATCH endpoint ${endpoint} failed:`, error.status, error.message);
        // Try next endpoint
        this.tryPatchEndpoints(endpoints, payload, user, newStatus, action, headers, index + 1);
      }
    });
  }
  
  private updateUserStatusLocally(user: User, newStatus: string): void {
    user.isActive = newStatus === 'ACTIVE';
    user.status = newStatus;
    
    // Update in both arrays
    const customerIndex = this.customers.findIndex(c => c.userId === user.userId);
    if (customerIndex !== -1) {
      this.customers[customerIndex] = { ...user };
    }
    
    const filteredIndex = this.filteredCustomers.findIndex(c => c.userId === user.userId);
    if (filteredIndex !== -1) {
      this.filteredCustomers[filteredIndex] = { ...user };
    }
  }

  // deleteUser method removed - only status change (soft delete) allowed

  // Officer Actions - Removed edit functionality
  // editOfficer method removed - only view and status change allowed
  
  viewOfficerDetails(officer: ComplianceOfficer): void {
    this.viewingOfficer = officer;
    this.showOfficerDetailsModal = true;
  }
  
  closeOfficerDetailsModal(): void {
    this.showOfficerDetailsModal = false;
    this.viewingOfficer = null;
  }
  
  // All officer edit-related methods removed - only view and status change allowed

  toggleOfficerStatus(officer: ComplianceOfficer): void {
    const action = officer.isActive ? 'deactivate' : 'activate';
    
    // Show confirmation dialog
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Officer`,
      message: `Are you sure you want to ${action} ${officer.firstName} ${officer.lastName}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: officer.isActive ? 'warning' : 'info'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      const newStatus = !officer.isActive;
      const endpoints = [
        `${this.apiUrl}/admin/officers/${officer.officerId}/status`
      ];
      
      const statusString = newStatus ? 'ACTIVE' : 'INACTIVE';
      const payload = {
        status: statusString,
        isActive: newStatus
      };
      
      this.tryOfficerStatusUpdate(endpoints[0], payload, officer, newStatus, action, headers);
    });
  }
  
  private tryOfficerStatusUpdate(endpoint: string, payload: any, officer: ComplianceOfficer, newStatus: boolean, action: string, headers: HttpHeaders): void {
    console.log(`Updating officer status via ${endpoint}`, payload);
    
    // Use PUT as per backend controller, expect text response (same as customer status)
    this.http.put(endpoint, payload, { headers, responseType: 'text' }).subscribe({
      next: (response) => {
        console.log(`Officer ${action}d successfully:`, response);
        this.updateOfficerStatusLocally(officer, newStatus);
        this.toastService.success(`Officer ${action}d successfully!`);
        // Reload officers to ensure data is fresh
        this.loadOfficers();
      },
      error: (error) => {
        console.error(`Officer status update failed:`, error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        this.toastService.error(`Failed to ${action} officer: ${error.error?.message || error.message || 'Unknown error'}`);
      }
    });
  }

  private updateOfficerStatusLocally(officer: ComplianceOfficer, newStatus: boolean): void {
    officer.isActive = newStatus;
    
    // Update in arrays
    const officerIndex = this.officers.findIndex(o => o.officerId === officer.officerId);
    if (officerIndex !== -1) {
      this.officers[officerIndex] = { ...officer };
    }
    
    const filteredIndex = this.filteredOfficers.findIndex(o => o.officerId === officer.officerId);
    if (filteredIndex !== -1) {
      this.filteredOfficers[filteredIndex] = { ...officer };
    }
  }

  // deleteOfficer method removed - only status change (soft delete) via toggleOfficerStatus allowed

  // Navigation
  navigateToTab(tab: string): void {
    switch(tab) {
      case 'dashboard':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'users':
        this.router.navigate(['/admin/users']);
        break;
      case 'kyc':
        this.router.navigate(['/admin/kyc-review']);
        break;
      case 'rules':
        this.router.navigate(['/admin/rules']);
        break;
      case 'audit':
        this.router.navigate(['/admin/audit']);
        break;
      case 'reports':
        this.router.navigate(['/admin/reports']);
        break;
      case 'keywords':
        this.router.navigate(['/admin/keywords']);
        break;
      case 'countries':
        this.router.navigate(['/admin/countries']);
        break;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/auth/login']);
  }

  // Helper methods for data processing
  private normalizeStatus(status: string): string {
    if (!status) return 'ACTIVE';
    const upperStatus = status.toUpperCase();
    if (['SUSPENDED', 'INACTIVE', 'BLOCKED', 'DISABLED'].includes(upperStatus)) {
      return upperStatus;
    }
    return 'ACTIVE';
  }
  
  private determineActiveStatus(customer: any): boolean {
    // Check multiple possible active status indicators
    if (customer.isActive === false) return false;
    if (customer.active === false) return false;
    
    const status = (customer.accountStatus || customer.status || customer.userStatus || '').toUpperCase();
    if (['SUSPENDED', 'INACTIVE', 'BLOCKED', 'DISABLED', 'DEACTIVATED'].includes(status)) {
      return false;
    }
    
    return true;
  }

  // Utility Methods
  getStatusClass(status: string, isActive: boolean): string {
    if (!isActive || status === 'SUSPENDED' || status === 'INACTIVE') {
      return 'inactive';
    }
    return 'active';
  }

  getStatusText(status: string, isActive: boolean): string {
    if (!isActive || status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'INACTIVE') {
      return 'INACTIVE';
    }
    return status || 'ACTIVE';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  getCustomerCount(): number {
    return this.customers.length;
  }

  getOfficerCount(): number {
    return this.officers.length;
  }

  // Add Officer Modal Methods
  openAddOfficerModal(): void {
    this.showAddOfficerModal = true;
    this.resetNewOfficerForm();
  }

  closeAddOfficerModal(): void {
    this.showAddOfficerModal = false;
    this.resetNewOfficerForm();
  }

  resetNewOfficerForm(): void {
    this.newOfficer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    };
  }

  addOfficer(): void {
    // Auto-generate password if empty
    if (!this.newOfficer.password.trim()) {
      this.generatePassword();
    }

    if (!this.validateOfficerForm()) {
      return;
    }

    this.addingOfficer = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const officerRequest = {
      firstName: this.newOfficer.firstName.trim(),
      lastName: this.newOfficer.lastName.trim(),
      email: this.newOfficer.email.trim(),
      phone: this.newOfficer.phone.trim(),
      password: this.newOfficer.password
    };

    console.log('Creating officer:', officerRequest);

    this.http.post<ComplianceOfficer>(`${this.apiUrl}/admin/officers`, officerRequest, { headers })
      .subscribe({
        next: (newOfficer) => {
          console.log('Officer created successfully:', newOfficer);
          
          // Add the new officer to the list
          const processedOfficer: ComplianceOfficer = {
            officerId: newOfficer.officerId || Date.now(),
            firstName: newOfficer.firstName,
            lastName: newOfficer.lastName,
            email: newOfficer.email,
            phone: newOfficer.phone || 'No phone provided',
            employeeId: newOfficer.employeeId || `EMP${newOfficer.officerId}`,
            department: newOfficer.department || 'Compliance',
            isActive: true,
            createdAt: new Date().toISOString()
          };
          
          this.officers.push(processedOfficer);
          this.filteredOfficers = [...this.officers];
          
          this.addingOfficer = false;
          this.closeAddOfficerModal();
          this.toastService.success('Officer added successfully!');
        },
        error: (error) => {
          console.error('Error creating officer:', error);
          this.addingOfficer = false;
          
          let errorMessage = this.parseErrorMessage(error);
          this.toastService.error(errorMessage);
        }
      });
  }

  validateOfficerForm(): boolean {
    const errors: string[] = [];
    
    if (!this.newOfficer.firstName.trim()) {
      errors.push('First name is required');
    }
    
    if (!this.newOfficer.lastName.trim()) {
      errors.push('Last name is required');
    }
    
    if (!this.newOfficer.email.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.newOfficer.email)) {
      errors.push('Please enter a valid email address');
    } else if (this.isEmailAlreadyExists(this.newOfficer.email)) {
      errors.push('This email address is already registered. Please use a different email.');
    }
    
    if (!this.newOfficer.password.trim()) {
      errors.push('Password is required');
    } else if (this.newOfficer.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (errors.length > 0) {
      this.toastService.error('Please fix the following errors: ' + errors.join(', '));
      return false;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isEmailAlreadyExists(email: string): boolean {
    const emailLower = email.toLowerCase().trim();
    
    // Check in officers list
    const existsInOfficers = this.officers.some(officer => 
      officer.email.toLowerCase().trim() === emailLower
    );
    
    // Check in customers list
    const existsInCustomers = this.customers.some(customer => 
      customer.email.toLowerCase().trim() === emailLower
    );
    
    return existsInOfficers || existsInCustomers;
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newOfficer.password = password;
  }

  private parseErrorMessage(error: any): string {
    console.log('Full error object:', error);
    
    // Check for duplicate email constraint
    if (error.error && typeof error.error === 'string') {
      if (error.error.includes('Duplicate entry') && error.error.includes('email')) {
        return 'This email address is already registered. Please use a different email address.';
      }
      if (error.error.includes('UK6dotkott2kjsp8vw4d0m25fb7')) {
        return 'This email address is already registered. Please use a different email address.';
      }
    }
    
    // Check for structured error response
    if (error.error?.message) {
      const message = error.error.message;
      if (message.includes('Duplicate entry') || message.includes('already exists')) {
        if (message.includes('email')) {
          return 'This email address is already registered. Please use a different email address.';
        }
        return 'This information is already registered. Please check your input.';
      }
      return `Failed to add officer: ${message}`;
    }
    
    // Check for validation errors
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      const errorMessages = error.error.errors.map((err: any) => err.message || err).join(', ');
      return `Validation failed: ${errorMessages}`;
    }
    
    // Check for status-specific errors
    if (error.status === 409) {
      return 'This email address is already registered. Please use a different email address.';
    }
    
    if (error.status === 400) {
      return 'Invalid data provided. Please check all fields and try again.';
    }
    
    if (error.status === 401) {
      return 'You are not authorized to perform this action. Please login again.';
    }
    
    if (error.status === 403) {
      return 'You do not have permission to add officers.';
    }
    
    // Default error message
    return error.message || 'Failed to add officer. Please try again.';
  }

  // Pagination methods
  getPaginatedCustomers(): User[] {
    const startIndex = (this.customerCurrentPage - 1) * this.customerPageSize;
    const endIndex = startIndex + this.customerPageSize;
    return this.filteredCustomers.slice(startIndex, endIndex);
  }

  getPaginatedOfficers(): ComplianceOfficer[] {
    const startIndex = (this.officerCurrentPage - 1) * this.officerPageSize;
    const endIndex = startIndex + this.officerPageSize;
    return this.filteredOfficers.slice(startIndex, endIndex);
  }

  onCustomerPageChange(page: number): void {
    this.customerCurrentPage = page;
  }

  onCustomerPageSizeChange(size: number): void {
    this.customerPageSize = size;
    this.customerCurrentPage = 1;
  }

  onOfficerPageChange(page: number): void {
    this.officerCurrentPage = page;
  }

  onOfficerPageSizeChange(size: number): void {
    this.officerPageSize = size;
    this.officerCurrentPage = 1;
  }

  // Account Management
  showAccountManagementModal: boolean = false;
  selectedCustomerForAccounts: User | null = null;
  customerAccounts: any[] = [];
  loadingAccounts: boolean = false;

  manageCustomerAccounts(customer: User): void {
    this.selectedCustomerForAccounts = customer;
    this.showAccountManagementModal = true;
    this.loadCustomerAccounts(customer.userId);
  }

  loadCustomerAccounts(customerId: number): void {
    // Safety check: Don't call API if customerId is null/undefined
    if (!customerId) {
      console.error('Cannot load accounts: customerId is null or undefined');
      this.toastService.error('Invalid customer ID');
      this.loadingAccounts = false;
      this.customerAccounts = [];
      return;
    }

    this.loadingAccounts = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(`${this.apiUrl}/admin/customers/${customerId}/accounts`, { headers })
      .subscribe({
        next: (accounts) => {
          this.customerAccounts = accounts;
          this.loadingAccounts = false;
        },
        error: (error) => {
          console.error('Error loading customer accounts:', error);
          this.toastService.error('Failed to load customer accounts');
          this.loadingAccounts = false;
          this.customerAccounts = [];
        }
      });
  }

  deactivateAccount(account: any): void {
    this.confirmationService.confirm({
      title: 'Deactivate Account',
      message: `Are you sure you want to deactivate account #${account.accountNumber}? This will block all FUTURE transactions (credit, debit, transfer). Past transactions will remain unchanged.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      type: 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = {
        reason: 'Account deactivated by admin'
      };

      this.http.put(`${this.apiUrl}/admin/accounts/${account.accountId}/deactivate`, payload, 
        { headers, responseType: 'text' })
        .subscribe({
          next: () => {
            this.toastService.success('Account deactivated - all future transactions blocked');
            this.loadCustomerAccounts(this.selectedCustomerForAccounts!.userId);
          },
          error: (error) => {
            console.error('Error deactivating account:', error);
            this.toastService.error('Failed to deactivate account');
          }
        });
    });
  }

  activateAccount(account: any): void {
    this.confirmationService.confirm({
      title: 'Activate Account',
      message: `Are you sure you want to activate account #${account.accountNumber}? This will allow new transactions again.`,
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'info'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.put(`${this.apiUrl}/admin/accounts/${account.accountId}/activate`, {}, 
        { headers, responseType: 'text' })
        .subscribe({
          next: () => {
            this.toastService.success('Account activated successfully');
            this.loadCustomerAccounts(this.selectedCustomerForAccounts!.userId);
          },
          error: (error) => {
            console.error('Error activating account:', error);
            this.toastService.error('Failed to activate account');
          }
        });
    });
  }

  closeAccountManagementModal(): void {
    this.showAccountManagementModal = false;
    this.selectedCustomerForAccounts = null;
    this.customerAccounts = [];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

}
