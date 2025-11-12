import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplianceService, SAR, Alert, Transaction } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface SARData {
  // All fields auto-populated from backend (read-only)
  subjectName: string;
  customerId: string;
  accountNumber: string;
  kycStatus: string;
  
  // Transaction Details (auto-populated)
  transactionId: string;
  transactionType: string;
  amount: number;
  currency: string;
  counterpartyName: string;
  counterpartyAccount: string;
  counterpartyCountry: string;
  transactionDate: string;
  
  // Alert Details (auto-populated)
  ruleTriggered: string;
  riskScore: number;
  alertSeverity: string;
  
  // Officer Info (auto-populated)
  officerName: string;
  officerId: string;
  
  // Editable Fields
  investigationNotes: string;  // Only editable field
  declaration: boolean;
}

interface SARDetailView {
  // Report Header / Metadata
  reportId: string;
  dateTimeGenerated: string;
  reportedBy: string;
  officerName: string;
  status: string;
  
  // Customer Details
  customerId: string;
  customerName: string;
  customerEmail: string;
  accountNumbers: string;
  kycStatus: string;
  linkedAccounts: string;
  
  // Transaction Details
  transactionId: string;
  transactionDateTime: string;
  transactionType: string;
  amount: number;
  currency: string;
  counterpartyName: string;
  counterpartyAccount: string;
  counterpartyCountry: string;
  frequency: string;
  triggeredRule: string;
  ruleDescription: string;
  
  // Suspicion Details
  suspicionDescription: string;
  suspicionType: string;
  supportingEvidence: string[];
  alertSeverity: string;
  
  // Risk Assessment
  customerRiskScore: number;
  transactionRiskScore: number;
  overallRiskLevel: string;
  rulesTriggered: string[];
  mlAnomalyScore: number;
  
  // Reporting Details
  reviewedBy: string;
  actionTaken: string;
  dateOfEscalation: string;
  fiuReferenceNumber: string;
  remarks: string;
  investigationNotes: string;  // Officer's investigation notes
  
  // Summary
  summary: string;
  totalAmount: number;
  transactionCount: number;
  dateRange: string;
  
  // Raw SAR data
  rawSAR: SAR;
  rawAlert: Alert | null;
  rawTransaction: Transaction | null;
}

@Component({
  selector: 'app-sar',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './sar.html',
  styleUrls: ['./sar.css']
})
export class Sar implements OnInit {
  Math = Math; // Expose Math to template
  sars: SAR[] = [];
  filteredSars: SAR[] = [];
  paginatedSars: SAR[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Filters
  searchQuery = '';
  filterStatus = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // SAR Form
  showSarForm = false;
  selectedAlertId: number | null = null;
  selectedAlert: Alert | null = null;
  
  // SAR Detail View
  showSarDetail = false;
  selectedSarDetail: SARDetailView | null = null;
  
  // Custom Modal Confirmations
  showSubmitConfirmModal = false;
  showRegulatorSubmitModal = false;
  pendingRegulatorSarId: number | null = null;
  
  // Comprehensive SAR Data
  sarData: SARData = {
    subjectName: '',
    customerId: '',
    accountNumber: '',
    kycStatus: 'Verified',
    transactionId: '',
    transactionType: '',
    amount: 0,
    currency: 'USD',
    counterpartyName: '',
    counterpartyAccount: '',
    counterpartyCountry: '',
    transactionDate: '',
    ruleTriggered: '',
    riskScore: 0,
    alertSeverity: '',
    officerName: '',
    officerId: '',
    investigationNotes: '',
    declaration: false
  };
  
  constructor(
    private complianceService: ComplianceService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSARs();
    
    // Check if there's an alert ID in query params
    this.route.queryParams.subscribe(params => {
      if (params['alertId']) {
        this.selectedAlertId = parseInt(params['alertId']);
        this.openSarForm(this.selectedAlertId);
      }
    });
  }

  loadSARs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.complianceService.getAllSARs().subscribe({
      next: (sars) => {
        this.sars = sars;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SARs:', error);
        this.errorMessage = 'Failed to load SARs';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.sars];
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === this.filterStatus);
    }
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.sarId.toString().includes(query) ||
        s.alertId.toString().includes(query)
      );
    }
    
    this.filteredSars = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSars.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedSars = this.filteredSars.slice(startIndex, endIndex);
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
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  openSarForm(alertId: number): void {
    // First check if a SAR already exists for this alert
    const existingSAR = this.sars.find(sar => sar.alertId === alertId);
    
    if (existingSAR) {
      this.toastService.error(`SAR already exists for this alert! SAR #${existingSAR.sarId} was previously generated. Only one SAR can be created per alert.`);
      return;
    }
    
    this.showSarForm = true;
    this.selectedAlertId = alertId;
    this.resetSarData();
    
    // Load alert details and auto-populate SAR form
    this.complianceService.getAlertDetails(alertId).subscribe({
      next: (alert) => {
        this.selectedAlert = alert;
        this.autoPopulateSARData(alert);
      },
      error: (error) => {
        console.error('Error loading alert:', error);
        this.errorMessage = 'Failed to load alert details';
      }
    });
  }

  autoPopulateSARData(alert: Alert): void {
    // Customer Information (read-only)
    this.sarData.subjectName = alert.customerName || '';
    this.sarData.customerId = `CUST${alert.customerId}`;
    this.sarData.kycStatus = 'Verified';
    
    // Alert Information (read-only)
    this.sarData.ruleTriggered = alert.ruleTriggered;
    this.sarData.riskScore = alert.riskScore;
    this.sarData.alertSeverity = alert.riskScore >= 80 ? 'High' : alert.riskScore >= 50 ? 'Medium' : 'Low';
    
    // Load transaction details from backend
    this.loadTransactionDetailsForForm(alert.transactionId);
    
    // Officer Information (read-only) - Load from profile API
    this.loadOfficerInformation();
    
    // Investigation Notes (editable) - start empty
    this.sarData.investigationNotes = '';
    this.sarData.declaration = false;
  }

  loadOfficerInformation(): void {
    // Always try to fetch from API first for most accurate data
    this.complianceService.getOfficerProfile().subscribe({
      next: (profile) => {
        console.log('Officer profile loaded:', profile);
        this.sarData.officerName = `${profile.firstName} ${profile.lastName}`;
        
        // API returns 'officerId' not 'userId'
        const officerId = profile.officerId || profile.userId;
        if (officerId) {
          this.sarData.officerId = `OFF${officerId}`;
          localStorage.setItem('userId', officerId.toString());
        } else {
          this.sarData.officerId = 'N/A';
          console.warn('No officer ID found in profile');
        }
        
        // Store for future use
        localStorage.setItem('firstName', profile.firstName);
        localStorage.setItem('lastName', profile.lastName);
        console.log('Officer info set:', this.sarData.officerName, this.sarData.officerId);
      },
      error: (error) => {
        console.error('Error loading officer profile from API, trying localStorage:', error);
        // Fallback to localStorage
        const storedFirstName = localStorage.getItem('firstName');
        const storedLastName = localStorage.getItem('lastName');
        const storedUserId = localStorage.getItem('userId');
        const storedEmail = localStorage.getItem('email');
        
        if (storedFirstName && storedLastName && storedUserId) {
          this.sarData.officerName = `${storedFirstName} ${storedLastName}`;
          this.sarData.officerId = `OFF${storedUserId}`;
          console.log('Officer info from localStorage:', this.sarData.officerName, this.sarData.officerId);
        } else if (storedEmail && storedUserId) {
          // Last resort - use email username
          this.sarData.officerName = storedEmail.split('@')[0];
          this.sarData.officerId = `OFF${storedUserId}`;
          console.log('Officer info from email:', this.sarData.officerName, this.sarData.officerId);
        } else {
          this.sarData.officerName = 'Compliance Officer';
          this.sarData.officerId = 'N/A';
          console.warn('Could not load officer information');
        }
      }
    });
  }

  loadTransactionDetailsForForm(transactionId: number): void {
    this.complianceService.getTransactionDetails(transactionId).subscribe({
      next: (transaction) => {
        console.log('Transaction details loaded:', transaction);
        
        this.sarData.transactionId = `TXN${transaction.transactionId}`;
        this.sarData.transactionType = transaction.transactionType || 'Transfer';
        this.sarData.amount = transaction.amount || 0;
        this.sarData.currency = transaction.currency || 'USD';
        this.sarData.counterpartyName = transaction.counterpartyName || 'Unknown';
        this.sarData.counterpartyAccount = transaction.counterpartyAccount || 'N/A';
        this.sarData.counterpartyCountry = transaction.countryCode || 'Unknown';
        this.sarData.transactionDate = new Date(transaction.timestamp).toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        
        // Fix account number - use senderAccountNumber or counterpartyAccount
        if (transaction.senderAccountNumber && transaction.senderAccountNumber !== 'EXTERNAL') {
          this.sarData.accountNumber = transaction.senderAccountNumber;
        } else if (transaction.counterpartyAccount) {
          this.sarData.accountNumber = transaction.counterpartyAccount;
        } else {
          this.sarData.accountNumber = 'N/A';
        }
        
        console.log('SAR Data populated:', this.sarData);
      },
      error: (error) => {
        console.error('Error loading transaction details:', error);
        this.errorMessage = 'Failed to load transaction details';
        // Set default values on error
        this.sarData.transactionId = `TXN${transactionId}`;
        this.sarData.transactionType = 'Transfer';
        this.sarData.amount = 0;
        this.sarData.currency = 'USD';
        this.sarData.counterpartyName = 'Unknown';
        this.sarData.counterpartyCountry = 'Unknown';
        this.sarData.transactionDate = new Date().toLocaleDateString('en-US', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        this.sarData.accountNumber = 'N/A';
      }
    });
  }

  mapRuleToActivityType(rule: string): string {
    const ruleMap: { [key: string]: string } = {
      'Threshold': 'STRUCTURING',
      'Velocity': 'RAPID_MOVEMENT',
      'Cross-Border': 'HIGH_RISK_JURISDICTION',
      'Rapid': 'RAPID_MOVEMENT',
      'Structuring': 'STRUCTURING',
      'Unusual': 'UNUSUAL_TRANSACTIONS'
    };
    
    for (const key in ruleMap) {
      if (rule.includes(key)) {
        return ruleMap[key];
      }
    }
    return 'UNUSUAL_TRANSACTIONS';
  }

  getRuleDescription(rule: string, alert?: any): string {
    // Always use dynamic description from database
    if (alert && alert.ruleDescription) {
      return alert.ruleDescription;
    }
    
    // If no alert or no description, return default message
    return 'No rule description available';
  }

  generateActivityDescription(alert: Alert, amount?: number, currency?: string): string {
    const date = new Date(alert.createdAt).toLocaleDateString();
    const amountStr = amount ? amount.toLocaleString() : '[Amount to be loaded]';
    const currencyStr = currency || 'USD';
    
    return `On ${date}, suspicious activity was detected for customer ${alert.customerName} (Customer ID: ${alert.customerId}).

WHAT WAS OBSERVED:
The system flagged a transaction of ${currencyStr} ${amountStr} that triggered the following rule: "${alert.ruleTriggered}". This transaction exhibited patterns consistent with potential money laundering activity.

WHEN IT OCCURRED:
Alert generated: ${date}
Transaction date: ${date}
Risk Score: ${alert.riskScore}/100

HOW IT WAS DETECTED:
The transaction was automatically flagged by our AML monitoring system based on predefined risk rules and behavioral analysis algorithms.

WHY IT IS SUSPICIOUS:
- High risk score of ${alert.riskScore} indicates significant deviation from normal customer behavior
- Transaction pattern matches known money laundering typologies
- ${alert.ruleTriggered}

PATTERNS IDENTIFIED:
The activity shows characteristics of ${this.getActivityCharacteristics(alert.ruleTriggered)}.`;
  }

  getActivityCharacteristics(rule: string): string {
    if (rule.includes('Structuring')) {
      return 'structuring or smurfing, where large amounts are broken into smaller transactions to avoid reporting thresholds';
    } else if (rule.includes('Velocity')) {
      return 'rapid movement of funds, with unusually high transaction frequency in a short time period';
    } else if (rule.includes('Cross-Border')) {
      return 'cross-border transfers to high-risk jurisdictions with weak AML controls';
    } else if (rule.includes('Rapid')) {
      return 'rapid withdrawal patterns inconsistent with the customer\'s stated business purpose';
    }
    return 'unusual transaction patterns that deviate significantly from the customer\'s historical behavior';
  }

  generateInvestigationTemplate(alert: Alert): string {
    return `INVESTIGATION STEPS TAKEN:
1. Reviewed customer transaction history for the past 90 days
2. Analyzed transaction patterns and frequency
3. Verified customer identity and KYC documentation
4. Checked customer against sanctions lists and PEP databases
5. Reviewed source of funds and business relationships

INFORMATION GATHERED:
- Customer Name: ${alert.customerName}
- Customer ID: ${alert.customerId}
- Alert ID: ${alert.alertId}
- Transaction ID: ${alert.transactionId}
- Risk Score: ${alert.riskScore}/100
- Rule Triggered: ${alert.ruleTriggered}
- Alert Status: ${alert.status}
- Investigation Status: ${alert.investigationStatus}

CUSTOMER RESPONSES:
[To be completed by officer if customer was contacted]

ADDITIONAL RED FLAGS DISCOVERED:
[To be completed by officer based on investigation]

CONCLUSION:
Based on the investigation conducted, the suspicious activity warrants filing of this SAR report. The transaction patterns and risk indicators suggest potential money laundering activity that requires regulatory attention.`;
  }

  generateSupportingDocsList(alert: Alert): string {
    return `• Alert Report #${alert.alertId}
• Transaction records for Customer ID ${alert.customerId}
• Customer account statements
• KYC documentation and identification verification
• Transaction monitoring system logs
• Risk assessment reports
• Customer communication records (if applicable)
• Previous investigation reports (if applicable)`;
  }

  formatDateRange(date: string): string {
    const alertDate = new Date(date);
    const startDate = new Date(alertDate);
    startDate.setDate(startDate.getDate() - 30); // 30 days before alert
    
    return `${startDate.toLocaleDateString()} - ${alertDate.toLocaleDateString()}`;
  }

  closeSarForm(): void {
    this.showSarForm = false;
    this.selectedAlertId = null;
    this.selectedAlert = null;
    this.resetSarData();
  }

  resetSarData(): void {
    this.sarData = {
      subjectName: '',
      customerId: '',
      accountNumber: '',
      kycStatus: 'Verified',
      transactionId: '',
      transactionType: '',
      amount: 0,
      currency: 'USD',
      counterpartyName: '',
      counterpartyAccount: '',
      counterpartyCountry: '',
      transactionDate: '',
      ruleTriggered: '',
      riskScore: 0,
      alertSeverity: '',
      officerName: '',
      officerId: '',
      investigationNotes: '',
      declaration: false
    };
  }

  isFormValid(): boolean {
    return !!(
      this.sarData.investigationNotes.trim() &&
      this.sarData.declaration
    );
  }

  submitSAR(): void {
    if (!this.selectedAlertId) {
      this.toastService.error('No alert selected');
      return;
    }

    if (!this.isFormValid()) {
      this.toastService.error('Please provide investigation notes and accept the declaration');
      return;
    }
    
    // Show custom confirmation modal
    this.showSubmitConfirmModal = true;
  }

  confirmSubmitSAR(): void {
    this.showSubmitConfirmModal = false;
    
    if (!this.selectedAlertId) return;
    
    // Only send the investigation notes to the backend
    const sarRequest = {
      summary: this.sarData.investigationNotes
    };
    
    this.isLoading = true;
    this.complianceService.generateSAR(this.selectedAlertId, sarRequest).subscribe({
      next: (sar) => {
        this.toastService.success(`SAR Report #${sar.sarId} has been successfully generated and submitted for Alert #${this.selectedAlertId}!`);
        this.closeSarForm();
        this.loadSARs();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating SAR:', error);
        // Show the actual backend error message with proper formatting
        let errorMsg = error.error?.message || error.error?.error || 'Failed to create SAR';
        
        // Clean up the error message format
        if (errorMsg.includes('An unexpected error occurred:')) {
          errorMsg = errorMsg.replace('An unexpected error occurred: ', '');
        }
        
        this.toastService.error(`Failed to submit SAR: ${errorMsg}`);
        this.isLoading = false;
      }
    });
  }

  cancelSubmitSAR(): void {
    this.showSubmitConfirmModal = false;
  }

  generateSARSummaryFromData(): string {
    const sections = [];
    
    sections.push('=== SUSPICIOUS ACTIVITY REPORT ===\n');
    
    // Customer Information
    sections.push('CUSTOMER INFORMATION:');
    sections.push(`Name: ${this.sarData.subjectName}`);
    sections.push(`Customer ID: ${this.sarData.customerId}`);
    sections.push(`Account Number: ${this.sarData.accountNumber}`);
    sections.push(`KYC Status: ${this.sarData.kycStatus}\n`);
    
    // Transaction Details
    sections.push('TRANSACTION DETAILS:');
    sections.push(`Transaction ID: ${this.sarData.transactionId}`);
    sections.push(`Date: ${this.sarData.transactionDate}`);
    sections.push(`Type: ${this.sarData.transactionType}`);
    sections.push(`Amount: ${this.sarData.currency} ${this.sarData.amount.toLocaleString()}`);
    sections.push(`Counterparty Name: ${this.sarData.counterpartyName}`);
    sections.push(`Counterparty Account: ${this.sarData.counterpartyAccount}`);
    sections.push(`Counterparty Country: ${this.sarData.counterpartyCountry}\n`);
    
    // Alert Information
    sections.push('ALERT INFORMATION:');
    sections.push(`Rule Triggered: ${this.sarData.ruleTriggered}`);
    sections.push(`Risk Score: ${this.sarData.riskScore}/100`);
    sections.push(`Severity: ${this.sarData.alertSeverity}\n`);
    
    // Investigation Notes
    sections.push('INVESTIGATION FINDINGS:');
    sections.push(this.sarData.investigationNotes);
    sections.push('');
    
    // Officer Declaration
    sections.push('COMPLIANCE OFFICER:');
    sections.push(`Name: ${this.sarData.officerName}`);
    sections.push(`Officer ID: ${this.sarData.officerId}`);
    sections.push(`Date: ${new Date().toLocaleDateString()}`);
    
    return sections.join('\n');
  }

  submitSARToRegulator(sarId: number): void {
    this.pendingRegulatorSarId = sarId;
    this.showRegulatorSubmitModal = true;
  }

  confirmRegulatorSubmit(): void {
    this.showRegulatorSubmitModal = false;
    
    if (!this.pendingRegulatorSarId) return;
    
    const sarId = this.pendingRegulatorSarId;
    this.pendingRegulatorSarId = null;
    
    this.complianceService.submitSAR(sarId).subscribe({
      next: (sar) => {
        this.toastService.success(`SAR #${sarId} has been successfully submitted to the regulator!`);
        this.loadSARs();
      },
      error: (error) => {
        console.error('Error submitting SAR:', error);
        this.toastService.error(`Failed to submit SAR #${sarId} to regulator. Please try again.`);
      }
    });
  }

  cancelRegulatorSubmit(): void {
    this.showRegulatorSubmitModal = false;
    this.pendingRegulatorSarId = null;
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'DRAFT': 'status-draft',
      'SUBMITTED': 'status-submitted',
      'PENDING': 'status-pending',
      'ACKNOWLEDGED': 'status-acknowledged'
    };
    return statusMap[status] || 'status-draft';
  }

  viewSARDetails(sar: SAR): void {
    this.isLoading = true;
    
    // Load alert details for the SAR
    this.complianceService.getAlertDetails(sar.alertId).subscribe({
      next: (alert) => {
        // Load transaction details
        this.complianceService.getTransactionDetails(alert.transactionId).subscribe({
          next: (transaction) => {
            this.selectedSarDetail = this.buildSARDetailView(sar, alert, transaction);
            this.showSarDetail = true;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading transaction details:', error);
            this.selectedSarDetail = this.buildSARDetailView(sar, alert, null);
            this.showSarDetail = true;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
        this.errorMessage = 'Failed to load SAR details';
        this.isLoading = false;
      }
    });
  }

  buildSARDetailView(sar: SAR, alert: Alert, transaction: Transaction | null): SARDetailView {
    const reportDate = new Date(sar.createdAt);
    const transactionDate = transaction ? new Date(transaction.timestamp) : new Date(alert.createdAt);
    
    // Use real officer name from SAR response
    const officerName = (sar as any).officerName || localStorage.getItem('email')?.split('@')[0] || 'Compliance Officer';
    
    // Fetch transaction count from backend (for now using mock, should be enhanced)
    const transactionCount = 5;
    const totalAmount = transaction ? transaction.amount * transactionCount : 0;
    
    return {
      // Report Header / Metadata
      reportId: `SAR-${reportDate.getFullYear()}-${String(sar.sarId).padStart(4, '0')}`,
      dateTimeGenerated: reportDate.toLocaleString('en-US', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }),
      reportedBy: `Compliance Officer`,
      officerName: officerName,
      status: sar.status,
      
      // Customer Details
      customerId: `CUST${alert.customerId}`,
      customerName: alert.customerName,
      customerEmail: transaction?.customerEmail || 'N/A',
      accountNumbers: transaction?.senderAccountNumber || 'N/A',
      kycStatus: 'Verified',
      linkedAccounts: transaction?.counterpartyAccount || 'N/A',
      
      // Transaction Details
      transactionId: `TXN${alert.transactionId}`,
      transactionDateTime: transactionDate.toLocaleString('en-US', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }),
      transactionType: transaction?.transactionType || 'Wire Transfer',
      amount: transaction?.amount || 0,
      currency: transaction?.currency || 'INR',
      counterpartyName: transaction?.counterpartyName || 'Unknown',
      counterpartyAccount: transaction?.counterpartyAccount || 'N/A',
      counterpartyCountry: transaction?.countryCode || 'Unknown',
      frequency: `${transactionCount} transfers in 2 days`,
      triggeredRule: alert.ruleTriggered,
      ruleDescription: this.getRuleDescription(alert.ruleTriggered),
      
      // Suspicion Details
      suspicionDescription: this.extractSuspicionDescription(sar.summary),
      suspicionType: this.mapRuleToActivityType(alert.ruleTriggered),
      supportingEvidence: [
        `transactions_${alert.transactionId}.csv`,
        `kyc_${alert.customerName.replace(/\s+/g, '_')}.pdf`,
        `audit_${alert.customerId}.log`,
        `txn_alert_${alert.transactionId}.png`
      ],
      alertSeverity: alert.riskScore >= 80 ? 'High' : alert.riskScore >= 50 ? 'Medium' : 'Low',
      
      // Risk Assessment
      customerRiskScore: alert.riskScore,
      transactionRiskScore: transaction?.riskScore || alert.riskScore,
      overallRiskLevel: alert.riskScore >= 70 ? 'High' : alert.riskScore >= 40 ? 'Medium' : 'Low',
      rulesTriggered: [alert.ruleTriggered],
      mlAnomalyScore: alert.riskScore / 100,
      
      // Reporting Details
      reviewedBy: officerName,
      actionTaken: sar.status === 'SUBMITTED' ? 'Escalated' : sar.status === 'DRAFT' ? 'Under Review' : sar.status,
      dateOfEscalation: sar.submittedAt ? new Date(sar.submittedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not yet escalated',
      fiuReferenceNumber: sar.submittedAt ? `FIU-IN/SAR/${reportDate.getFullYear()}/${String(sar.sarId).padStart(4, '0')}` : 'Pending',
      remarks: this.extractRemarks(sar.summary),
      investigationNotes: this.extractInvestigationNotes(sar.summary),
      
      // Summary
      summary: this.generateSARSummary(sar, alert, transaction),
      totalAmount: totalAmount,
      transactionCount: transactionCount,
      dateRange: this.calculateDateRange(transactionDate),
      
      // Raw data
      rawSAR: sar,
      rawAlert: alert,
      rawTransaction: transaction
    };
  }

  extractSuspicionDescription(summary: string): string {
    // Extract the main description from summary
    const lines = summary.split('\n');
    for (const line of lines) {
      if (line.includes('Customer') || line.includes('suspicious') || line.includes('activity')) {
        return line.trim();
      }
    }
    return summary.substring(0, 200);
  }

  extractInvestigationNotes(summary: string): string {
    // If summary contains the full formatted report, extract just the investigation notes
    const investigationSection = summary.match(/INVESTIGATION FINDINGS:([\s\S]*?)(?:COMPLIANCE OFFICER:|$)/i);
    if (investigationSection && investigationSection[1]) {
      return investigationSection[1].trim();
    }
    
    // If it doesn't contain the formatted structure, the summary IS the investigation notes
    // (This happens when we store only notes in the database)
    if (!summary.includes('=== SUSPICIOUS ACTIVITY REPORT ===') && 
        !summary.includes('CUSTOMER INFORMATION:')) {
      return summary.trim();
    }
    
    return 'No investigation notes available';
  }

  extractRemarks(summary: string): string {
    // Try to extract remarks or use default
    if (summary.includes('CONCLUSION')) {
      const parts = summary.split('CONCLUSION');
      if (parts.length > 1) {
        return parts[1].substring(0, 150).trim();
      }
    }
    return 'Customer activity requires regulatory attention and further investigation.';
  }

  calculateDateRange(transactionDate: Date): string {
    const endDate = new Date(transactionDate);
    const startDate = new Date(transactionDate);
    startDate.setDate(startDate.getDate() - 2);
    
    return `${startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }

  generateSARSummary(sar: SAR, alert: Alert, transaction: Transaction | null): string {
    const reportDate = new Date(sar.createdAt);
    const amount = transaction ? transaction.amount.toLocaleString() : 'N/A';
    const currency = transaction?.currency || 'USD';
    
    return `This SAR was generated on ${reportDate.toLocaleDateString('en-US', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    })} for Customer ${alert.customerName} (${`CUST${alert.customerId}`}) due to suspicious transaction activity totaling ${currency} ${amount}. The transactions triggered Rule: ${alert.ruleTriggered}. Risk Level: ${alert.riskScore >= 70 ? 'High' : 'Medium'} | Status: ${sar.status}`;
  }

  closeSarDetail(): void {
    this.showSarDetail = false;
    this.selectedSarDetail = null;
  }

  formatSummaryForDisplay(summary: string): string {
    if (!summary) return '';
    
    // Replace line breaks with <br> tags
    let formatted = summary.replace(/\n/g, '<br>');
    
    // Make section headers bold (lines ending with :)
    formatted = formatted.replace(/^([A-Z\s]+:)/gm, '<strong>$1</strong>');
    
    // Make "===" lines into horizontal rules
    formatted = formatted.replace(/={3,}/g, '<hr style="border: 1px solid #e5e7eb; margin: 10px 0;">');
    
    // Make "---" lines into lighter horizontal rules
    formatted = formatted.replace(/-{3,}/g, '<hr style="border: 0.5px dashed #d1d5db; margin: 8px 0;">');
    
    return formatted;
  }

  downloadSARPDFFromTable(sar: SAR): void {
    // Build SAR detail view from SAR object
    this.viewSARDetails(sar);
    // Wait for data to load, then download
    setTimeout(() => {
      if (this.selectedSarDetail) {
        this.downloadSARPDF(this.selectedSarDetail);
        this.closeSarDetail();
      }
    }, 500);
  }

  saveInvestigationNotes(): void {
    if (!this.selectedSarDetail || !this.selectedSarDetail.investigationNotes?.trim()) {
      this.errorMessage = 'Please provide investigation notes';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Update the SAR with new investigation notes
    const sarId = this.selectedSarDetail.rawSAR.sarId;
    const updateRequest = {
      summary: this.selectedSarDetail.investigationNotes
    };

    this.complianceService.updateSAR(sarId, updateRequest).subscribe({
      next: (updatedSar) => {
        this.successMessage = 'Investigation notes saved successfully';
        // Update the local data
        if (this.selectedSarDetail) {
          this.selectedSarDetail.rawSAR.summary = this.selectedSarDetail.investigationNotes;
        }
        this.loadSARs(); // Reload the list
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error saving investigation notes:', error);
        this.errorMessage = 'Failed to save investigation notes';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  downloadSARPDF(sarDetail: SARDetailView): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Modern Header with Gradient Effect
    pdf.setFillColor(30, 58, 138); // Dark blue
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Add subtle accent line
    pdf.setFillColor(59, 130, 246); // Lighter blue
    pdf.rect(0, 48, pageWidth, 2, 'F');
    
    // Logo/Icon area (left side)
    pdf.setFillColor(255, 255, 255);
    pdf.circle(25, 25, 8, 'F');
    pdf.setFillColor(30, 58, 138);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('!', 25, 28, { align: 'center' });
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUSPICIOUS ACTIVITY REPORT', pageWidth / 2, 22, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Financial Intelligence Unit Report', pageWidth / 2, 30, { align: 'center' });
    
    // Report metadata in header
    pdf.setFontSize(9);
    pdf.text(`Report ID: ${sarDetail.reportId}`, pageWidth / 2, 38, { align: 'center' });
    pdf.text(`Generated: ${sarDetail.dateTimeGenerated}`, pageWidth / 2, 44, { align: 'center' });

    // Status Badge (top right corner)
    const statusColor = sarDetail.status === 'SUBMITTED' ? [16, 185, 129] : 
                       sarDetail.status === 'PENDING' ? [245, 158, 11] : [251, 191, 36];
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.roundedRect(pageWidth - 45, 10, 35, 8, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sarDetail.status, pageWidth - 27.5, 15, { align: 'center' });
    
    yPos = 60;
    pdf.setTextColor(0, 0, 0);

    // Section 1: Customer Information
    yPos = this.addModernSectionHeader(pdf, '1. CUSTOMER INFORMATION', yPos, margin);
    const customerData = [
      ['Customer Name', sarDetail.customerName],
      ['Customer ID', sarDetail.customerId],
      ['Email Address', sarDetail.customerEmail],
      ['Account Number', sarDetail.accountNumbers],
      ['KYC Status', sarDetail.kycStatus]
    ];
    yPos = this.addModernTable(pdf, customerData, yPos, margin, contentWidth);

    // Section 2: Transaction Details
    yPos = this.addModernSectionHeader(pdf, '2. TRANSACTION DETAILS', yPos + 8, margin);
    const transactionData = [
      ['Transaction ID', sarDetail.transactionId],
      ['Date & Time', sarDetail.transactionDateTime],
      ['Transaction Type', sarDetail.transactionType],
      ['Amount', `${sarDetail.currency} ${sarDetail.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Counterparty Name', sarDetail.counterpartyName],
      ['Counterparty Account', sarDetail.counterpartyAccount],
      ['Counterparty Country', sarDetail.counterpartyCountry]
    ];
    yPos = this.addModernTable(pdf, transactionData, yPos, margin, contentWidth);

    // Check if new page needed
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = 20;
    }

    // Section 3: Alert & Risk Assessment
    yPos = this.addModernSectionHeader(pdf, '3. ALERT & RISK ASSESSMENT', yPos + 8, margin);
    const alertData = [
      ['Rule Triggered', sarDetail.triggeredRule],
      ['Alert Severity', sarDetail.alertSeverity],
      ['Customer Risk Score', `${sarDetail.customerRiskScore} / 100`],
      ['Transaction Risk Score', `${sarDetail.transactionRiskScore} / 100`],
      ['Overall Risk Level', sarDetail.overallRiskLevel]
    ];
    yPos = this.addModernTable(pdf, alertData, yPos, margin, contentWidth);

    // Section 4: Compliance Officer
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = 20;
    }
    yPos = this.addModernSectionHeader(pdf, '4. COMPLIANCE OFFICER', yPos + 8, margin);
    const officerData = [
      ['Officer Name', sarDetail.reviewedBy],
      ['Officer ID', `OFF${sarDetail.rawSAR?.officerId || 'N/A'}`],
      ['Review Date', sarDetail.dateTimeGenerated]
    ];
    yPos = this.addModernTable(pdf, officerData, yPos, margin, contentWidth);

    // Section 5: Investigation Notes
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = 20;
    }
    yPos = this.addModernSectionHeader(pdf, '5. INVESTIGATION FINDINGS', yPos + 8, margin);
    
    // Add investigation notes in a box
    pdf.setFillColor(249, 250, 251);
    const notesHeight = 60;
    pdf.rect(margin, yPos, contentWidth, notesHeight, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(margin, yPos, contentWidth, notesHeight);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    const splitNotes = pdf.splitTextToSize(sarDetail.investigationNotes || 'No investigation notes provided.', contentWidth - 8);
    pdf.text(splitNotes, margin + 4, yPos + 6);
    yPos += notesHeight + 5;

    // Professional Footer on all pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Footer content
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      
      // Left: Confidentiality notice
      pdf.text('CONFIDENTIAL - For Official Use Only', margin, pageHeight - 12);
      
      // Center: Organization name
      pdf.text('Financial Intelligence Unit', pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Right: Page number
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
      
      // Bottom: Date generated
      pdf.setFontSize(6);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`Generated: ${new Date().toLocaleString('en-US', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      })}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    }

    // Save PDF with professional filename
    const fileName = `SAR_${sarDetail.reportId}_${sarDetail.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    this.successMessage = `SAR report downloaded: ${fileName}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  addModernSectionHeader(pdf: jsPDF, title: string, yPos: number, margin: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Section background with left accent
    pdf.setFillColor(241, 245, 249); // Light gray background
    pdf.rect(margin, yPos - 2, pageWidth - (margin * 2), 12, 'F');
    
    // Left accent bar
    pdf.setFillColor(59, 130, 246); // Blue accent
    pdf.rect(margin, yPos - 2, 3, 12, 'F');
    
    // Section title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138);
    pdf.text(title, margin + 8, yPos + 5);
    
    return yPos + 15;
  }

  addModernTable(pdf: jsPDF, data: any[][], yPos: number, margin: number, contentWidth: number): number {
    (pdf as any).autoTable({
      startY: yPos,
      head: [],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [229, 231, 235],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          textColor: [71, 85, 105],
          cellWidth: 55,
          fillColor: [249, 250, 251]
        },
        1: { 
          textColor: [15, 23, 42],
          fontStyle: 'normal'
        }
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data: any) => {
        // Add subtle border to cells
        if (data.section === 'body') {
          pdf.setDrawColor(229, 231, 235);
          pdf.setLineWidth(0.1);
        }
      }
    });
    return (pdf as any).lastAutoTable.finalY + 2;
  }

  generatePDFContent(sar: SARDetailView): string {
    const lines = [];
    const separator = '=' .repeat(80);
    const subSeparator = '-'.repeat(80);
    
    lines.push(separator);
    lines.push('SUSPICIOUS ACTIVITY REPORT (SAR)');
    lines.push(separator);
    lines.push('');
    
    // 1. Report Header / Metadata
    lines.push('1. REPORT HEADER / METADATA');
    lines.push(subSeparator);
    lines.push(`Report ID:                    ${sar.reportId}`);
    lines.push(`Date & Time of Generation:    ${sar.dateTimeGenerated}`);
    lines.push(`Reported By:                  ${sar.reportedBy}`);
    lines.push('');
    
    // 2. Customer Details
    lines.push('2. CUSTOMER DETAILS');
    lines.push(subSeparator);
    lines.push(`Customer ID:                  ${sar.customerId}`);
    lines.push(`Customer Name:                ${sar.customerName}`);
    lines.push(`Account Number(s):            ${sar.accountNumbers}`);
    lines.push(`KYC Status:                   ${sar.kycStatus}`);
    lines.push(`Linked Accounts/Entities:     ${sar.linkedAccounts}`);
    lines.push('');
    
    // 3. Transaction Details
    lines.push('3. TRANSACTION DETAILS');
    lines.push(subSeparator);
    lines.push(`Transaction ID:               ${sar.transactionId}`);
    lines.push(`Transaction Date & Time:      ${sar.transactionDateTime}`);
    lines.push(`Transaction Type:             ${sar.transactionType}`);
    lines.push(`Amount:                       ${sar.currency} ${sar.amount.toLocaleString()}`);
    lines.push(`Currency:                     ${sar.currency}`);
    lines.push(`Counterparty Details:         ${sar.counterpartyName}, ${sar.counterpartyCountry}`);
    lines.push(`Frequency/Pattern:            ${sar.frequency}`);
    lines.push(`Triggered Rule/Scenario ID:   ${sar.triggeredRule}`);
    lines.push(`Rule Description:             ${sar.ruleDescription}`);
    lines.push('');
    
    // 4. Suspicion Details
    lines.push('4. SUSPICION DETAILS / REASON FOR REPORTING');
    lines.push(subSeparator);
    lines.push(`Description of Suspicious Activity:`);
    lines.push(this.wrapText(sar.suspicionDescription, 80));
    lines.push('');
    lines.push(`Suspicion Type:               ${sar.suspicionType}`);
    lines.push(`Supporting Evidence/Logs:     ${sar.supportingEvidence.join(', ')}`);
    lines.push(`Alert Severity/Priority:      ${sar.alertSeverity}`);
    lines.push('');
    
    // 5. Risk Assessment Summary
    lines.push('5. RISK ASSESSMENT SUMMARY');
    lines.push(subSeparator);
    lines.push(`Customer Risk Score:          ${sar.customerRiskScore} / 100`);
    lines.push(`Transaction Risk Score:       ${sar.transactionRiskScore} / 100`);
    lines.push(`Overall Risk Level:           ${sar.overallRiskLevel}`);
    lines.push(`Rule(s) Triggered:            ${sar.rulesTriggered.join(', ')}`);
    lines.push(`AI/ML Anomaly Score:          ${sar.mlAnomalyScore.toFixed(2)}`);
    lines.push('');
    
    // 6. Attached Evidence
    lines.push('6. ATTACHED EVIDENCE');
    lines.push(subSeparator);
    sar.supportingEvidence.forEach((evidence, index) => {
      lines.push(`- ${evidence}`);
    });
    lines.push('');
    
    // 7. Reporting and Follow-up Details
    lines.push('7. REPORTING AND FOLLOW-UP DETAILS');
    lines.push(subSeparator);
    lines.push(`Reviewed By:                  ${sar.reviewedBy}`);
    lines.push(`Action Taken:                 ${sar.actionTaken}`);
    lines.push(`Date of Escalation:           ${sar.dateOfEscalation}`);
    lines.push(`FIU Reference Number:         ${sar.fiuReferenceNumber}`);
    lines.push(`Remarks/Comments:             ${sar.remarks}`);
    lines.push('');
    
    // 8. Summary
    lines.push('8. SUMMARY');
    lines.push(subSeparator);
    lines.push(this.wrapText(sar.summary, 80));
    lines.push('');
    lines.push(`Total Amount:                 ${sar.currency} ${sar.totalAmount.toLocaleString()}`);
    lines.push(`Transaction Count:            ${sar.transactionCount}`);
    lines.push(`Date Range:                   ${sar.dateRange}`);
    lines.push('');
    
    // 9. Full Report Details
    lines.push('9. DETAILED INVESTIGATION REPORT');
    lines.push(subSeparator);
    lines.push(sar.rawSAR.summary);
    lines.push('');
    
    lines.push(separator);
    lines.push('END OF REPORT');
    lines.push(separator);
    
    return lines.join('\n');
  }

  wrapText(text: string, maxLength: number): string {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length > maxLength) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines.join('\n');
  }
}
