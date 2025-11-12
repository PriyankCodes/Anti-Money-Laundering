import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RuleService } from '../../../core/services/rule.service';
import { Rule, RuleCreateRequest, RuleUpdateRequest } from '../../../core/models/rule.models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// Field configuration interfaces
interface RuleFieldConfig {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  description?: string;
}

interface RuleTypeConfig {
  fields: RuleFieldConfig[];
  description: string;
}

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './rules.html',
  styleUrl: './rules.css',
})
export class Rules implements OnInit {
  rules: Rule[] = [];
  filteredRules: Rule[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Statistics
  totalRules: number = 0;
  activeRules: number = 0;
  inactiveRules: number = 0;
  
  // Filter states
  typeFilter: string = 'all';
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
  newRule: RuleCreateRequest = {
    name: '',
    type: 'PATTERN',
    impact: 50,
    description: '',
    condition: ''
  };
  
  editRule: RuleUpdateRequest = {};
  selectedRule: Rule | null = null;
  
  // Form validation
  formErrors: any = {};
  isSubmitting: boolean = false;
  
  // Dynamic form fields
  dynamicFormFields: any = {};
  editDynamicFormFields: any = {};
  
  // Rule type configurations
  ruleTypeConfigs: { [key: string]: RuleTypeConfig } = {
    'THRESHOLD': {
      description: 'Detects transactions based on amount thresholds and account behavior patterns. Supports multi-currency thresholds, ranges, and deviation from historical behavior.',
      fields: [
        {
          name: 'amountThresholdUSD',
          label: 'Amount Threshold (USD)',
          type: 'number',
          required: false,
          placeholder: '10000',
          description: 'Threshold amount in USD'
        },
        {
          name: 'amountThresholdINR',
          label: 'Amount Threshold (INR)',
          type: 'number',
          required: false,
          placeholder: '830000',
          description: 'Threshold amount in INR'
        },
        {
          name: 'amountThresholdEUR',
          label: 'Amount Threshold (EUR)',
          type: 'number',
          required: false,
          placeholder: '9200',
          description: 'Threshold amount in EUR'
        },
        {
          name: 'transactionType',
          label: 'Transaction Type',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'All Types' },
            { value: 'CREDIT', label: 'CREDIT' },
            { value: 'DEBIT', label: 'DEBIT' },
            { value: 'TRANSFER', label: 'TRANSFER' }
          ],
          description: 'Filter by transaction type'
        },
        {
          name: 'isCrossBorder',
          label: 'Cross-Border Only',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Apply only to international transfers'
        },
        {
          name: 'amountToBalanceRatio',
          label: 'Amount to Balance Ratio',
          type: 'number',
          required: false,
          placeholder: '0.8',
          description: 'Trigger if amount exceeds % of balance (e.g., 0.8 = 80%)',
          min: 0,
          max: 1
        },
        {
          name: 'historicalDays',
          label: 'Historical Days',
          type: 'number',
          required: false,
          placeholder: '30',
          description: 'Days to look back for average calculation',
          min: 1
        },
        {
          name: 'deviationFactor',
          label: 'Deviation Factor',
          type: 'number',
          required: false,
          placeholder: '5',
          description: 'Multiplier for historical average (e.g., 5 = 5x average)',
          min: 1
        },
        {
          name: 'normalizeByCurrency',
          label: 'Normalize By Currency',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Calculate averages separately per currency'
        },
        {
          name: 'rangeMinINR',
          label: 'Range Min (INR)',
          type: 'number',
          required: false,
          placeholder: '9000',
          description: 'Minimum amount for range-based detection (INR)'
        },
        {
          name: 'rangeMaxINR',
          label: 'Range Max (INR)',
          type: 'number',
          required: false,
          placeholder: '10000',
          description: 'Maximum amount for range-based detection (INR)'
        },
        {
          name: 'rangeMinUSD',
          label: 'Range Min (USD)',
          type: 'number',
          required: false,
          placeholder: '120',
          description: 'Minimum amount for range-based detection (USD)'
        },
        {
          name: 'rangeMaxUSD',
          label: 'Range Max (USD)',
          type: 'number',
          required: false,
          placeholder: '125',
          description: 'Maximum amount for range-based detection (USD)'
        },
        {
          name: 'rangeMinEUR',
          label: 'Range Min (EUR)',
          type: 'number',
          required: false,
          placeholder: '110',
          description: 'Minimum amount for range-based detection (EUR)'
        },
        {
          name: 'rangeMaxEUR',
          label: 'Range Max (EUR)',
          type: 'number',
          required: false,
          placeholder: '115',
          description: 'Maximum amount for range-based detection (EUR)'
        }
      ]
    },
    'FREQUENCY': {
      description: 'Detects rapid succession of transactions within a time window. Supports structuring detection, burst activity, dormant-to-active spikes, and cash deposit frequency.',
      fields: [
        {
          name: 'maxTransactions',
          label: 'Max Transactions',
          type: 'number',
          required: true,
          placeholder: '5',
          min: 1,
          description: 'Maximum allowed transactions in window'
        },
        {
          name: 'timeWindowMinutes',
          label: 'Time Window (Minutes)',
          type: 'number',
          required: true,
          placeholder: '60',
          min: 1,
          description: 'Time window in minutes (e.g., 60=1hr, 1440=1day, 43200=30days)'
        },
        {
          name: 'nearThresholdPct',
          label: 'Near Threshold Percentage',
          type: 'number',
          required: false,
          placeholder: '0.95',
          description: 'Percentage of reporting threshold (e.g., 0.95 = 95%)',
          min: 0,
          max: 1
        },
        {
          name: 'applyToCredit',
          label: 'Apply to Credit',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Apply rule to credit transactions'
        },
        {
          name: 'applyToDebit',
          label: 'Apply to Debit',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Apply rule to debit transactions'
        },
        {
          name: 'dormantDays',
          label: 'Dormant Days',
          type: 'number',
          required: false,
          placeholder: '30',
          min: 1,
          description: 'Days of inactivity before flagging (for dormant-to-active detection)'
        },
        {
          name: 'minAmountINR',
          label: 'Min Amount (INR)',
          type: 'number',
          required: false,
          placeholder: '500000',
          description: 'Minimum amount for dormant account check (INR)'
        },
        {
          name: 'minAmountUSD',
          label: 'Min Amount (USD)',
          type: 'number',
          required: false,
          placeholder: '7000',
          description: 'Minimum amount for dormant account check (USD)'
        },
        {
          name: 'minAmountEUR',
          label: 'Min Amount (EUR)',
          type: 'number',
          required: false,
          placeholder: '6500',
          description: 'Minimum amount for dormant account check (EUR)'
        },
        {
          name: 'requireFirstLargeAfterDormancy',
          label: 'Require First Large After Dormancy',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Trigger only on first large transaction after dormancy'
        },
        {
          name: 'perCurrencyOverrideINRMaxTransactions',
          label: 'INR Max Transactions Override',
          type: 'number',
          required: false,
          placeholder: '12',
          min: 1,
          description: 'Override max transactions for INR (if different from default)'
        },
        {
          name: 'perCurrencyOverrideUSDMaxTransactions',
          label: 'USD Max Transactions Override',
          type: 'number',
          required: false,
          placeholder: '10',
          min: 1,
          description: 'Override max transactions for USD (if different from default)'
        },
        {
          name: 'perCurrencyOverrideEURMaxTransactions',
          label: 'EUR Max Transactions Override',
          type: 'number',
          required: false,
          placeholder: '10',
          min: 1,
          description: 'Override max transactions for EUR (if different from default)'
        }
      ]
    },
    'VELOCITY': {
      description: 'Detects rapid movement of funds with specific patterns. Supports outbound velocity, alternating patterns, cumulative daily outflow, and weekly high volume detection.',
      fields: [
        {
          name: 'timeWindowMinutes',
          label: 'Time Window (Minutes)',
          type: 'number',
          required: true,
          placeholder: '30',
          min: 1,
          description: 'Primary time window for velocity check'
        },
        {
          name: 'minAmountINR',
          label: 'Min Amount (INR)',
          type: 'number',
          required: false,
          placeholder: '1000',
          description: 'Minimum transaction amount (INR)'
        },
        {
          name: 'minAmountUSD',
          label: 'Min Amount (USD)',
          type: 'number',
          required: false,
          placeholder: '15',
          description: 'Minimum transaction amount (USD)'
        },
        {
          name: 'minAmountEUR',
          label: 'Min Amount (EUR)',
          type: 'number',
          required: false,
          placeholder: '14',
          description: 'Minimum transaction amount (EUR)'
        },
        {
          name: 'maxTransactions',
          label: 'Max Transactions',
          type: 'number',
          required: true,
          placeholder: '5',
          min: 1,
          description: 'Maximum allowed transactions in window'
        },
        {
          name: 'applyTo',
          label: 'Apply To',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'All' },
            { value: 'outbound', label: 'Outbound Only' },
            { value: 'inbound', label: 'Inbound Only' }
          ],
          description: 'Transaction direction filter'
        },
        {
          name: 'checkAlternation',
          label: 'Check Alternating Pattern',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Check for alternating credit/debit pattern (layering)'
        },
        {
          name: 'totalAmountThresholdUSD',
          label: 'Total Amount Threshold (USD)',
          type: 'number',
          required: false,
          placeholder: '25000',
          description: 'Cumulative amount threshold (USD)'
        },
        {
          name: 'totalAmountThresholdINR',
          label: 'Total Amount Threshold (INR)',
          type: 'number',
          required: false,
          placeholder: '2075000',
          description: 'Cumulative amount threshold (INR)'
        },
        {
          name: 'totalAmountThresholdEUR',
          label: 'Total Amount Threshold (EUR)',
          type: 'number',
          required: false,
          placeholder: '23000',
          description: 'Cumulative amount threshold (EUR)'
        },
      ]
    },
    'FUNNEL_ACCOUNT': {
      description: 'Detects funnel accounts (many senders to one receiver - fan-in pattern). Supports short and extended time windows with multi-currency thresholds.',
      fields: [
        {
          name: 'minSendersShortWindow',
          label: 'Min Senders (Short Window)',
          type: 'number',
          required: true,
          placeholder: '5',
          min: 1,
          description: 'Minimum unique senders in short window'
        },
        {
          name: 'timeWindowMinutesShort',
          label: 'Time Window Short (Minutes)',
          type: 'number',
          required: true,
          placeholder: '60',
          min: 1,
          description: 'Short time window for counting senders'
        },
        {
          name: 'minSendersExtended',
          label: 'Min Senders (Extended Window)',
          type: 'number',
          required: false,
          placeholder: '20',
          min: 1,
          description: 'Minimum unique senders in extended window'
        },
        {
          name: 'timeWindowMinutesExtended',
          label: 'Time Window Extended (Minutes)',
          type: 'number',
          required: false,
          placeholder: '120',
          min: 1,
          description: 'Extended time window for counting senders'
        },
        {
          name: 'minAmountPerSenderINR',
          label: 'Min Amount Per Sender (INR)',
          type: 'number',
          required: false,
          placeholder: '100',
          description: 'Minimum amount per sender (INR)'
        },
        {
          name: 'minAmountPerSenderUSD',
          label: 'Min Amount Per Sender (USD)',
          type: 'number',
          required: false,
          placeholder: '2',
          description: 'Minimum amount per sender (USD)'
        },
        {
          name: 'minAmountPerSenderEUR',
          label: 'Min Amount Per Sender (EUR)',
          type: 'number',
          required: false,
          placeholder: '2',
          description: 'Minimum amount per sender (EUR)'
        },
        {
          name: 'aggregationTargetField',
          label: 'Aggregation Target Field',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'Default (receiverAccount)' },
            { value: 'receiverAccount', label: 'Receiver Account' },
            { value: 'senderAccount', label: 'Sender Account' }
          ],
          description: 'Field to aggregate on'
        }
      ]
    },
    'GEOGRAPHIC': {
      description: 'Detects transactions involving high-risk countries and sanctions lists. Supports multi-currency thresholds and multiple risk sources.',
      fields: [
        {
          name: 'highRiskThresholdUSD',
          label: 'High Risk Threshold (USD)',
          type: 'number',
          required: false,
          placeholder: '5000',
          description: 'Amount threshold for HIGH risk countries (USD)'
        },
        {
          name: 'highRiskThresholdINR',
          label: 'High Risk Threshold (INR)',
          type: 'number',
          required: false,
          placeholder: '415000',
          description: 'Amount threshold for HIGH risk countries (INR)'
        },
        {
          name: 'highRiskThresholdEUR',
          label: 'High Risk Threshold (EUR)',
          type: 'number',
          required: false,
          placeholder: '4600',
          description: 'Amount threshold for HIGH risk countries (EUR)'
        },
        {
          name: 'mediumRiskThresholdUSD',
          label: 'Medium Risk Threshold (USD)',
          type: 'number',
          required: false,
          placeholder: '20000',
          description: 'Amount threshold for MEDIUM risk countries (USD)'
        },
        {
          name: 'mediumRiskThresholdINR',
          label: 'Medium Risk Threshold (INR)',
          type: 'number',
          required: false,
          placeholder: '1660000',
          description: 'Amount threshold for MEDIUM risk countries (INR)'
        },
        {
          name: 'mediumRiskThresholdEUR',
          label: 'Medium Risk Threshold (EUR)',
          type: 'number',
          required: false,
          placeholder: '18400',
          description: 'Amount threshold for MEDIUM risk countries (EUR)'
        },
        {
          name: 'matchOriginCountry',
          label: 'Match Origin Country',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Check origin country against risk lists'
        },
        {
          name: 'matchDestinationCountry',
          label: 'Match Destination Country',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Check destination country against risk lists'
        },
      ]
    },
    'KEYWORD': {
      description: 'Detects suspicious keywords in transaction descriptions using database-stored keywords. Supports multiple context fields and matching modes.',
      fields: [
        {
          name: 'minMatches',
          label: 'Minimum Matches',
          type: 'number',
          required: false,
          placeholder: '1',
          min: 1,
          description: 'Minimum number of keywords to match'
        },
        {
          name: 'caseInsensitive',
          label: 'Case Insensitive',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Ignore case when matching'
        },
        {
          name: 'applyNormalization',
          label: 'Apply Normalization',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'true', label: 'Yes' }
          ],
          description: 'Normalize text before matching (remove special chars, etc.)'
        }
      ]
    },
    'PATTERN': {
      description: 'Detects specific patterns using regex matching on transaction fields. Supports repetitive reference codes, duplicate invoices, and custom patterns.',
      fields: [
        {
          name: 'regex',
          label: 'Regular Expression',
          type: 'text',
          required: true,
          placeholder: '\\b[A-Z]{3}[0-9]{3}\\b',
          description: 'Regular expression pattern (e.g., \\bINV[0-9]{4}\\b for invoices)'
        },
        {
          name: 'occurrenceWindowMinutes',
          label: 'Occurrence Window (Minutes)',
          type: 'number',
          required: false,
          placeholder: '10080',
          min: 1,
          description: 'Time window to check for repeated patterns (e.g., 10080 = 7 days)'
        },
        {
          name: 'minRepeats',
          label: 'Minimum Repeats',
          type: 'number',
          required: false,
          placeholder: '3',
          min: 1,
          description: 'Minimum number of times pattern must repeat to trigger'
        },
        {
          name: 'caseInsensitive',
          label: 'Case Insensitive',
          type: 'select',
          required: false,
          options: [
            { value: '', label: 'No' },
            { value: 'false', label: 'No (Case Sensitive)' },
            { value: 'true', label: 'Yes (Case Insensitive)' }
          ],
          description: 'Ignore case when matching pattern'
        }
      ]
    }
  };

  constructor(
    private ruleService: RuleService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  // Load rules from API
  loadRules(): void {
    this.loading = true;
    this.ruleService.getRules().subscribe({
      next: (rules) => {
        this.rules = rules;
        this.updateStatistics();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rules:', error);
        this.loading = false;
        this.rules = [];
        this.filteredRules = [];
        
        let errorMessage = 'Failed to load rules. ';
        if (error.status === 0) {
          errorMessage += 'Please check if the backend server is running.';
        } else if (error.status === 401) {
          errorMessage += 'Please login again.';
        } else if (error.status === 403) {
          errorMessage += 'You do not have permission to view rules.';
        } else if (error.status === 404) {
          errorMessage += 'Rules endpoint not found.';
        } else {
          errorMessage += `Server error: ${error.status}`;
        }
        
        this.showErrorMessage(errorMessage);
      }
    });
  }

  // Update statistics
  updateStatistics(): void {
    this.totalRules = this.rules.length;
    this.activeRules = this.rules.filter(r => r.isActive).length;
    this.inactiveRules = this.rules.filter(r => !r.isActive).length;
  }

  // Search and filter functionality
  onSearchChange(): void {
    this.applyFilters();
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.rules];
    
    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchLower) ||
        rule.type.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(rule => rule.type === this.typeFilter);
    }
    
    // Status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(rule => rule.isActive === isActive);
    }
    
    this.filteredRules = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  // Pagination methods
  getPaginatedRules(): Rule[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredRules.slice(startIndex, endIndex);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.filteredRules.length / this.pageSize);
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
    this.newRule = {
      name: '',
      type: 'PATTERN',
      impact: 50,
      description: '',
      condition: ''
    };
    this.dynamicFormFields = {};
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(rule: Rule): void {
    this.closeModals(); // Close any open modals first
    this.selectedRule = rule;
    
    // Ensure we have the complete rule data
    const condition = rule.condition || '';
    const description = rule.description || '';
    
    this.editRule = {
      name: rule.name,
      type: rule.type,
      impact: rule.impact,
      isActive: rule.isActive,
      description: description,
      condition: condition
    };
    
    // Parse existing condition to populate dynamic form fields
    this.editDynamicFormFields = {};
    if (condition && condition.trim()) {
      try {
        const parsed = JSON.parse(condition);
        this.editDynamicFormFields = { ...parsed };
      } catch (e) {
        console.error('Failed to parse condition:', e);
      }
    }
    
    this.formErrors = {};
    this.showEditModal = true;
  }

  openViewModal(rule: Rule): void {
    this.selectedRule = rule;
    this.showViewModal = true;
  }

  openDeleteModal(rule: Rule): void {
    this.selectedRule = rule;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedRule = null;
    this.dynamicFormFields = {};
    this.editDynamicFormFields = {};
    this.formErrors = {};
    this.isSubmitting = false;
  }

  // CRUD Operations
  createRule(): void {
    // Generate JSON condition from dynamic form fields
    this.newRule.condition = this.generateConditionJson(this.newRule.type, this.dynamicFormFields);
    
    if (!this.validateRuleForm(this.newRule)) {
      return;
    }

    this.isSubmitting = true;
    this.ruleService.createRule(this.newRule).subscribe({
      next: (rule) => {
        this.rules.push(rule);
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Rule created successfully');
      },
      error: (error) => {
        console.error('Error creating rule:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to create rule: ${errorMsg}`);
      }
    });
  }

  updateRule(): void {
    if (!this.selectedRule) {
      return;
    }
    
    // Generate JSON condition from dynamic form fields
    this.editRule.condition = this.generateConditionJson(this.editRule.type!, this.editDynamicFormFields);
    
    if (!this.validateRuleForm(this.editRule)) {
      return;
    }

    this.isSubmitting = true;
    this.ruleService.updateRule(this.selectedRule.id, this.editRule).subscribe({
      next: (updatedRule) => {
        const index = this.rules.findIndex(r => r.id === updatedRule.id);
        if (index !== -1) {
          this.rules[index] = updatedRule;
        }
        this.updateStatistics();
        this.applyFilters();
        this.closeModals();
        this.showSuccessMessage('Rule updated successfully');
      },
      error: (error) => {
        console.error('Error updating rule:', error);
        this.isSubmitting = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.showErrorMessage(`Failed to update rule: ${errorMsg}`);
      }
    });
  }

  deleteRule(): void {
    if (!this.selectedRule) return;

    // Show confirmation dialog
    this.confirmationService.confirm({
      title: 'Delete Rule',
      message: `Are you sure you want to delete the rule "${this.selectedRule.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) {
        this.closeModals();
        return;
      }

      this.isSubmitting = true;
      this.ruleService.deleteRule(this.selectedRule!.id).subscribe({
        next: () => {
          this.rules = this.rules.filter(r => r.id !== this.selectedRule!.id);
          this.updateStatistics();
          this.applyFilters();
          this.closeModals();
          this.showSuccessMessage('Rule deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting rule:', error);
          this.isSubmitting = false;
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.showErrorMessage(`Failed to delete rule: ${errorMsg}`);
        }
      });
    });
  }

  toggleRuleStatus(rule: Rule): void {
    const newStatus = !rule.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    // Show confirmation dialog
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Rule`,
      message: `Are you sure you want to ${action} the rule "${rule.name}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: newStatus ? 'info' : 'warning'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      
      // Use update endpoint with all data, just changing status
      const updatedRuleData = {
        ...rule,
        isActive: newStatus
      };
      
      this.ruleService.updateRule(rule.id, updatedRuleData).subscribe({
        next: (updatedRule) => {
          const index = this.rules.findIndex(r => r.id === updatedRule.id);
          if (index !== -1) {
            this.rules[index] = updatedRule;
          }
          this.updateStatistics();
          this.applyFilters();
          this.showSuccessMessage(`Rule ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (error) => {
          console.error('Error updating rule status:', error);
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.showErrorMessage(`Failed to update rule status: ${errorMsg}`);
        }
      });
    });
  }

  // Form validation
  private validateRuleForm(rule: any): boolean {
    this.formErrors = {};
    let isValid = true;

    // Name validation
    if (!rule.name || rule.name.trim().length === 0) {
      this.formErrors.name = 'Rule name is required';
      isValid = false;
    } else if (rule.name.trim().length < 3) {
      this.formErrors.name = 'Rule name must be at least 3 characters';
      isValid = false;
    } else if (rule.name.trim().length > 100) {
      this.formErrors.name = 'Rule name must be less than 100 characters';
      isValid = false;
    }

    // Type validation
    if (!rule.type) {
      this.formErrors.type = 'Rule type is required';
      isValid = false;
    }

    // Impact validation
    if (rule.impact === null || rule.impact === undefined || rule.impact < 0 || rule.impact > 100) {
      this.formErrors.impact = 'Impact must be between 0 and 100';
      isValid = false;
    }

    // Description validation
    if (rule.description && rule.description.length > 500) {
      this.formErrors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    // Condition validation
    if (rule.condition && rule.condition.trim().length > 0) {
      if (!this.validateConditionFormat(rule.condition)) {
        this.formErrors.condition = 'Invalid condition format. Use JSON format like: {"regex": "pattern", "field": "fieldName"}';
        isValid = false;
      }
    }
    
    // Validate dynamic fields (for add/edit forms)
    const formFields = this.showAddModal ? this.dynamicFormFields : this.editDynamicFormFields;
    if (!this.validateDynamicFields(rule.type, formFields)) {
      isValid = false;
    }

    return isValid;
  }

  // Validate condition JSON format based on rule engine specifications
  private validateConditionFormat(condition: string): boolean {
    try {
      const parsed = JSON.parse(condition);
      
      // Check if it's a valid condition object
      if (typeof parsed === 'object' && parsed !== null) {
        
        // THRESHOLD Rules - Amount-based conditions
        if (parsed.amountThreshold !== undefined) {
          const isValidAmount = typeof parsed.amountThreshold === 'number' || 
                               (typeof parsed.amountThreshold === 'string' && !isNaN(Number(parsed.amountThreshold)));
          if (!isValidAmount) return false;
        }
        
        if (parsed.minAmount !== undefined) {
          const isValidAmount = typeof parsed.minAmount === 'number' || 
                               (typeof parsed.minAmount === 'string' && !isNaN(Number(parsed.minAmount)));
          if (!isValidAmount) return false;
        }
        
        if (parsed.maxAmount !== undefined) {
          const isValidAmount = typeof parsed.maxAmount === 'number' || 
                               (typeof parsed.maxAmount === 'string' && !isNaN(Number(parsed.maxAmount)));
          if (!isValidAmount) return false;
        }
        
        // Currency validation
        if (parsed.currency !== undefined) {
          const validCurrencies = ['USD', 'EUR', 'INR', 'GBP', 'ANY'];
          if (typeof parsed.currency !== 'string' || !validCurrencies.includes(parsed.currency.toUpperCase())) {
            return false;
          }
        }
        
        // Transaction type validation
        if (parsed.transactionType !== undefined) {
          const validTypes = ['DEBIT', 'CREDIT', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'];
          if (typeof parsed.transactionType !== 'string' || !validTypes.includes(parsed.transactionType.toUpperCase())) {
            return false;
          }
        }
        
        // GEOGRAPHIC Rules
        if (parsed.highRiskAmountThreshold !== undefined || parsed.mediumRiskAmountThreshold !== undefined) {
          if (parsed.highRiskAmountThreshold !== undefined) {
            const isValid = typeof parsed.highRiskAmountThreshold === 'number' || 
                           (typeof parsed.highRiskAmountThreshold === 'string' && !isNaN(Number(parsed.highRiskAmountThreshold)));
            if (!isValid) return false;
          }
          if (parsed.mediumRiskAmountThreshold !== undefined) {
            const isValid = typeof parsed.mediumRiskAmountThreshold === 'number' || 
                           (typeof parsed.mediumRiskAmountThreshold === 'string' && !isNaN(Number(parsed.mediumRiskAmountThreshold)));
            if (!isValid) return false;
          }
        }
        
        // FREQUENCY Rules
        if (parsed.maxTransactions !== undefined) {
          if (typeof parsed.maxTransactions !== 'number' || parsed.maxTransactions < 0) return false;
        }
        
        if (parsed.timeWindowMinutes !== undefined) {
          if (typeof parsed.timeWindowMinutes !== 'number' || parsed.timeWindowMinutes < 0) return false;
        }
        
        // VELOCITY Rules (same as frequency but with minAmount)
        if (parsed.minAmount !== undefined && parsed.timeWindowMinutes !== undefined && parsed.maxTransactions !== undefined) {
          // Already validated above
        }
        
        // PATTERN Rules
        if (parsed.regex !== undefined) {
          if (typeof parsed.regex !== 'string') return false;
          // Validate field if present
          if (parsed.field !== undefined) {
            const validFields = ['description', 'amount'];
            if (typeof parsed.field !== 'string' || !validFields.includes(parsed.field.toLowerCase())) {
              return false;
            }
          }
        }
        
        // FUNNEL_ACCOUNT Rules
        if (parsed.minSenders !== undefined) {
          if (typeof parsed.minSenders !== 'number' || parsed.minSenders < 0) return false;
        }
        
        // KEYWORD Rules (empty objects are valid)
        if (Object.keys(parsed).length === 0) {
          return true; // Empty object is valid for KEYWORD rules
        }
        
        return true; // Valid if passes all checks
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  // Utility methods
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'THRESHOLD': return 'type-badge threshold';
      case 'GEOGRAPHIC': return 'type-badge geographic';
      case 'FREQUENCY': return 'type-badge frequency';
      case 'KEYWORD': return 'type-badge keyword';
      case 'PATTERN': return 'type-badge pattern';
      case 'VELOCITY': return 'type-badge velocity';
      case 'FUNNEL_ACCOUNT': return 'type-badge funnel-account';
      default: return 'type-badge pattern';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  }

  // Format JSON condition for display
  formatJsonCondition(condition: string): string {
    if (!condition || condition.trim() === '') {
      return 'No condition specified';
    }
    
    try {
      const parsed = JSON.parse(condition);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return condition; // Return as-is if not valid JSON
    }
  }

  // Handle condition input change for live preview
  onConditionChange(): void {
    // This method is called when the condition textarea changes
    // The preview will automatically update due to Angular's change detection
  }

  // Get condition hints based on rule type
  getConditionHints(ruleType: string): string[] {
    switch (ruleType) {
      case 'THRESHOLD':
        return [
          '{"amountThreshold": 50000, "currency": "USD"}',
          '{"minAmount": 9000, "maxAmount": 10000, "currency": "ANY"}',
          '{"amountThreshold": 100000, "transactionType": "TRANSFER"}'
        ];
      case 'GEOGRAPHIC':
        return [
          '{"highRiskAmountThreshold": 25000, "mediumRiskAmountThreshold": 250000}',
          '{"highRiskAmountThreshold": 10000}'
        ];
      case 'FREQUENCY':
        return [
          '{"maxTransactions": 5, "timeWindowMinutes": 60}',
          '{"maxTransactions": 10, "timeWindowMinutes": 1440}'
        ];
      case 'VELOCITY':
        return [
          '{"timeWindowMinutes": 30, "minAmount": 1000, "maxTransactions": 3}',
          '{"timeWindowMinutes": 60, "minAmount": 5000, "maxTransactions": 2}'
        ];
      case 'PATTERN':
        return [
          '{"regex": "cash.*deposit", "field": "description"}',
          '{"regex": "\\\\d{4,}", "field": "amount"}',
          '{"regex": "wire.*transfer|money.*order"}'
        ];
      case 'FUNNEL_ACCOUNT':
        return [
          '{"minSenders": 5, "timeWindowMinutes": 60}',
          '{"minSenders": 10, "timeWindowMinutes": 1440}'
        ];
      case 'KEYWORD':
        return ['{}'];
      default:
        return ['{}'];
    }
  }

  showSuccessMessage(message: string): void {
    this.toastService.success(message);
  }

  showErrorMessage(message: string): void {
    this.toastService.error(message);
  }
  
  // Dynamic form field methods
  getRuleTypeConfig(ruleType: string): RuleTypeConfig | null {
    return this.ruleTypeConfigs[ruleType] || null;
  }
  
  onRuleTypeChange(isEditMode: boolean = false): void {
    // Clear dynamic form fields when rule type changes
    if (isEditMode) {
      this.editDynamicFormFields = {};
    } else {
      this.dynamicFormFields = {};
    }
  }
  
  generateConditionJson(ruleType: string, formFields: any): string {
    const config = this.getRuleTypeConfig(ruleType);
    
    // For empty configs, return empty object
    if (!config || config.fields.length === 0) {
      return '{}';
    }
    
    const condition: any = {};
    
    // Handle multi-currency threshold fields (amountThreshold, ranges, etc.)
    const currencyFields = ['USD', 'INR', 'EUR'];
    const multiCurrencyMappings: any = {
      'amountThreshold': {},
      'ranges': {},
      'minAmount': {},
      'totalAmountThreshold': {},
      'minIndividualAmount': {},
      'minAmountPerSender': {},
      'highRiskThreshold': {},
      'mediumRiskThreshold': {},
      'minDepositAmount': {}
    };
    
    // Track which multi-currency fields have values
    const hasValues: any = {};
    
    // First pass: collect multi-currency values
    Object.keys(formFields).forEach(fieldName => {
      const value = formFields[fieldName];
      if (value === undefined || value === null || value === '') return;
      
      // Check if this is a multi-currency field
      for (const baseField of Object.keys(multiCurrencyMappings)) {
        for (const currency of currencyFields) {
          if (fieldName === `${baseField}${currency}`) {
            multiCurrencyMappings[baseField][currency] = Number(value);
            hasValues[baseField] = true;
            return;
          }
          // Handle range fields specially
          if (fieldName === `rangeMin${currency}`) {
            if (!multiCurrencyMappings['ranges'][currency]) {
              multiCurrencyMappings['ranges'][currency] = {};
            }
            multiCurrencyMappings['ranges'][currency].min = Number(value);
            hasValues['ranges'] = true;
            return;
          }
          if (fieldName === `rangeMax${currency}`) {
            if (!multiCurrencyMappings['ranges'][currency]) {
              multiCurrencyMappings['ranges'][currency] = {};
            }
            multiCurrencyMappings['ranges'][currency].max = Number(value);
            hasValues['ranges'] = true;
            return;
          }
        }
      }
    });
    
    // Add multi-currency objects to condition
    Object.keys(multiCurrencyMappings).forEach(baseField => {
      if (hasValues[baseField] && Object.keys(multiCurrencyMappings[baseField]).length > 0) {
        condition[baseField] = multiCurrencyMappings[baseField];
      }
    });
    
    // Handle perCurrencyOverrides for FREQUENCY rules
    const perCurrencyOverrides: any = {};
    currencyFields.forEach(currency => {
      const maxTransKey = `perCurrencyOverride${currency}MaxTransactions`;
      if (formFields[maxTransKey]) {
        if (!perCurrencyOverrides[currency]) {
          perCurrencyOverrides[currency] = {};
        }
        perCurrencyOverrides[currency].maxTransactions = Number(formFields[maxTransKey]);
      }
    });
    if (Object.keys(perCurrencyOverrides).length > 0) {
      condition.perCurrencyOverrides = perCurrencyOverrides;
    }
    
    // Handle special array fields
    const arrayFields: any = {
      'applyTo': [],
      'contextFields': [],
      'matchFields': [],
      'sanctionsFeeds': [],
      'currencies': ['USD', 'INR', 'EUR'] // Default currencies
    };
    
    // Build arrays from boolean flags
    if (formFields['applyToCredit'] === 'true') arrayFields['applyTo'].push('credit');
    if (formFields['applyToDebit'] === 'true') arrayFields['applyTo'].push('debit');
    if (formFields['contextFieldDescription'] === 'true') arrayFields['contextFields'].push('description');
    if (formFields['contextFieldRemitterNote'] === 'true') arrayFields['contextFields'].push('remitterNote');
    if (formFields['contextFieldBeneficiaryNote'] === 'true') arrayFields['contextFields'].push('beneficiaryNote');
    if (formFields['matchOriginCountry'] === 'true') arrayFields['matchFields'].push('originCountry');
    if (formFields['matchDestinationCountry'] === 'true') arrayFields['matchFields'].push('destinationCountry');
    if (formFields['matchCounterpartyCountry'] === 'true') arrayFields['matchFields'].push('counterpartyCountry');
    if (formFields['sanctionsFeedsOFAC'] === 'true') arrayFields['sanctionsFeeds'].push('OFAC');
    if (formFields['sanctionsFeedsUN'] === 'true') arrayFields['sanctionsFeeds'].push('UN');
    
    // Add non-empty arrays to condition
    Object.keys(arrayFields).forEach(field => {
      if (arrayFields[field].length > 0) {
        condition[field] = arrayFields[field];
      }
    });
    
    // Handle nested riskSources object for GEOGRAPHIC
    if (ruleType === 'GEOGRAPHIC') {
      const riskSources: any = {};
      if (formFields['countryListSource']) {
        riskSources.countryListSource = formFields['countryListSource'];
      }
      if (arrayFields['sanctionsFeeds'].length > 0) {
        riskSources.sanctionsFeeds = arrayFields['sanctionsFeeds'];
      }
      if (Object.keys(riskSources).length > 0) {
        condition.riskSources = riskSources;
      }
      
      // Handle thresholds object
      const thresholds: any = {};
      if (condition.highRiskThreshold) {
        thresholds.highRisk = condition.highRiskThreshold;
        delete condition.highRiskThreshold;
      }
      if (condition.mediumRiskThreshold) {
        thresholds.mediumRisk = condition.mediumRiskThreshold;
        delete condition.mediumRiskThreshold;
      }
      if (Object.keys(thresholds).length > 0) {
        condition.thresholds = thresholds;
      }
    }
    
    // Second pass: add regular fields (non-multi-currency, non-array-converted)
    const skipFields = new Set([
      ...currencyFields.flatMap(c => Object.keys(multiCurrencyMappings).map(f => `${f}${c}`)),
      ...currencyFields.flatMap(c => [`rangeMin${c}`, `rangeMax${c}`, `perCurrencyOverride${c}MaxTransactions`]),
      'applyToCredit', 'applyToDebit',
      'contextFieldDescription', 'contextFieldRemitterNote', 'contextFieldBeneficiaryNote',
      'matchOriginCountry', 'matchDestinationCountry', 'matchCounterpartyCountry',
      'sanctionsFeedsOFAC', 'sanctionsFeedsUN',
      'countryListSource', 'highRiskThreshold', 'mediumRiskThreshold'
    ]);
    
    config.fields.forEach(field => {
      if (skipFields.has(field.name)) return;
      
      const value = formFields[field.name];
      if (value === undefined || value === null || value === '') return;
      
      if (field.type === 'number') {
        condition[field.name] = Number(value);
      } else if (value === 'true') {
        condition[field.name] = true;
      } else if (value === 'false') {
        condition[field.name] = false;
      } else {
        condition[field.name] = value;
      }
    });
    
    return JSON.stringify(condition);
  }
  
  getGeneratedConditionPreview(ruleType: string, formFields: any): string {
    try {
      const json = this.generateConditionJson(ruleType, formFields);
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return '{}';
    }
  }
  
  validateDynamicFields(ruleType: string, formFields: any): boolean {
    const config = this.getRuleTypeConfig(ruleType);
    if (!config) return true;
    
    let isValid = true;
    
    // Check required fields
    config.fields.forEach(field => {
      if (field.required) {
        const value = formFields[field.name];
        if (value === undefined || value === null || value === '') {
          this.formErrors[field.name] = `${field.label} is required`;
          isValid = false;
        }
      }
    });
    
    // Special validation for THRESHOLD rule
    if (ruleType === 'THRESHOLD') {
      const hasAmountThreshold = formFields['amountThreshold'] !== undefined && 
                                 formFields['amountThreshold'] !== null && 
                                 formFields['amountThreshold'] !== '';
      const hasMinAmount = formFields['minAmount'] !== undefined && 
                          formFields['minAmount'] !== null && 
                          formFields['minAmount'] !== '';
      const hasMaxAmount = formFields['maxAmount'] !== undefined && 
                          formFields['maxAmount'] !== null && 
                          formFields['maxAmount'] !== '';
      
      if (!hasAmountThreshold && !hasMinAmount && !hasMaxAmount) {
        this.formErrors['amountThreshold'] = 'At least one of Amount Threshold, Min Amount, or Max Amount is required';
        isValid = false;
      }
    }
    
    return isValid;
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
