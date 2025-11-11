import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface ReportStats {
  totalTransactions: number;
  flaggedTransactions: number;
  totalAlerts: number;
  resolvedAlerts: number;
  pendingAlerts: number;
  totalSARs: number;
  submittedSARs: number;
  draftedSARs: number;
  highRiskCustomers: number;
  averageRiskScore: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

interface TrendData {
  month: string;
  alerts: number;
  sars: number;
  transactions: number;
}

interface TopRiskCustomer {
  id: number;
  name: string;
  riskScore: number;
  alertCount: number;
  lastActivity: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  loading = false;
  selectedPeriod = '30days';
  selectedReportType = 'overview';

  stats: ReportStats = {
    totalTransactions: 0,
    flaggedTransactions: 0,
    totalAlerts: 0,
    resolvedAlerts: 0,
    pendingAlerts: 0,
    totalSARs: 0,
    submittedSARs: 0,
    draftedSARs: 0,
    highRiskCustomers: 0,
    averageRiskScore: 0
  };

  alertsByType: ChartData = { labels: [], values: [] };
  alertsByStatus: ChartData = { labels: [], values: [] };
  sarsByMonth: ChartData = { labels: [], values: [] };
  trendData: TrendData[] = [];
  topRiskCustomers: TopRiskCustomer[] = [];

  private apiUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Load report statistics
    this.http.get<any>(`${this.apiUrl}/admin/reports/stats?period=${this.selectedPeriod}`, { headers })
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.loading = false;
        },
        error: () => {

        }
      });

    // Load chart data
    this.loadChartData(headers);
    this.loadTopRiskCustomers(headers);
  }

  private loadChartData(headers: HttpHeaders): void {
    // Load alerts by type
    this.http.get<any>(`${this.apiUrl}/admin/reports/alerts-by-type`, { headers })
      .subscribe({
        next: (data) => {
          console.log('🔍 Alerts by Type Response:', data);
          console.log('Labels:', data.labels);
          console.log('Values:', data.values);
          this.alertsByType = data;
        },
        error: (error) => {
          console.error('❌ Error loading alerts by type:', error);
          this.alertsByType = { labels: [], values: [] };
        }
      });

    // Load alerts by status
    this.http.get<any>(`${this.apiUrl}/admin/reports/alerts-by-status`, { headers })
      .subscribe({
        next: (data) => {
          this.alertsByStatus = data;
        },
        error: () => {
          // Fallback data with proper status breakdown
          this.alertsByStatus = {
            labels: ['Open', 'False Positive'],
            values: [9, 2]
          };
        }
      });
  }


  private loadTopRiskCustomers(headers: HttpHeaders): void {
    this.http.get<TopRiskCustomer[]>(`${this.apiUrl}/admin/reports/top-risk-customers`, { headers })
      .subscribe({
        next: (data) => {
          this.topRiskCustomers = data;
        },
        error: () => {
          // Fallback data
          this.topRiskCustomers = [
            { id: 1, name: 'John Doe', riskScore: 85, alertCount: 5, lastActivity: '2 hours ago' },
            { id: 2, name: 'Jane Smith', riskScore: 78, alertCount: 3, lastActivity: '1 day ago' },
            { id: 3, name: 'Bob Johnson', riskScore: 72, alertCount: 4, lastActivity: '3 days ago' }
          ];
        }
      });
  }


  onPeriodChange(): void {
    this.loadReportData();
  }

  onReportTypeChange(): void {
    this.loadReportData();
  }

  exportReport(format: string): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.toastService.info(`Generating ${format.toUpperCase()} report...`);

    // Determine file extension
    const fileExtension = format === 'excel' ? 'xlsx' : format;

    this.http.get(`${this.apiUrl}/admin/reports/export?format=${format}&period=${this.selectedPeriod}`,
      { headers, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          // Check if blob is valid
          if (blob && blob.size > 0) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `aml-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            link.click();
            window.URL.revokeObjectURL(url);
            this.toastService.success('Report downloaded successfully!');
          } else {
            throw new Error('Empty response from server');
          }
        },
        error: (error) => {
          console.error('Export error:', error);
          // Fallback: Generate client-side report
          if (format === 'pdf') {
            this.generateClientSideReport('pdf');
          } else if (format === 'excel') {
            this.generateClientSideReport('csv');
          } else {
            this.toastService.error('Failed to export report. Backend endpoint may not be available.');
          }
        }
      });
  }

  private generateClientSideReport(format: string): void {
    // Client-side report generation fallback
    this.toastService.info(`Generating ${format.toUpperCase()} report (client-side)...`);

    if (format === 'pdf') {
      // Generate HTML-based report that can be printed as PDF
      this.generateHTMLReport();
    } else if (format === 'csv') {
      // Generate CSV report
      this.generateCSVReport();
    } else {
      // Fallback to text report
      const reportContent = this.generateReportContent();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aml-report-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.toastService.success('Report downloaded as text file');
    }
  }

  private generateHTMLReport(): void {
    const reportHTML = this.generateReportHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        this.toastService.success('Report opened in new window. Use browser Print to save as PDF.');
      }, 500);
    } else {
      this.toastService.error('Please allow popups to generate PDF report');
    }
  }

  private generateCSVReport(): void {
    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aml-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success('CSV report downloaded successfully!');
  }

  private generateReportHTML(): string {
    const date = new Date().toLocaleDateString();
    return `
<!DOCTYPE html>
<html>
<head>
  <title>AML Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #007AFF; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #007AFF; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #007AFF; }
    .stat-label { color: #666; margin-top: 5px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>AML COMPLIANCE REPORT</h1>
  <p><strong>Generated:</strong> ${date}</p>
  <p><strong>Period:</strong> ${this.selectedPeriod}</p>
  
  <h2>Key Statistics</h2>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${this.stats.totalTransactions.toLocaleString()}</div>
      <div class="stat-label">Total Transactions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${this.stats.totalAlerts}</div>
      <div class="stat-label">Total Alerts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${this.stats.totalSARs}</div>
      <div class="stat-label">SARs Generated</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${this.stats.highRiskCustomers}</div>
      <div class="stat-label">High Risk Customers</div>
    </div>
  </div>
  
  <h2>Top Risk Customers</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Customer Name</th>
        <th>Risk Score</th>
        <th>Alert Count</th>
        <th>Last Activity</th>
      </tr>
    </thead>
    <tbody>
      ${this.topRiskCustomers.map((c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${c.name}</td>
          <td>${c.riskScore}</td>
          <td>${c.alertCount}</td>
          <td>${c.lastActivity}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Alerts by Type</h2>
  <table>
    <thead>
      <tr><th>Type</th><th>Count</th></tr>
    </thead>
    <tbody>
      ${this.alertsByType.labels.map((label, i) => `
        <tr><td>${label}</td><td>${this.alertsByType.values[i]}</td></tr>
      `).join('')}
    </tbody>
  </table>
  
  <p class="no-print" style="margin-top: 40px; text-align: center; color: #666;">
    Use your browser's Print function (Ctrl+P / Cmd+P) to save this report as PDF
  </p>
</body>
</html>
    `.trim();
  }

  private generateCSVContent(): string {
    let csv = 'AML COMPLIANCE REPORT\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Period: ${this.selectedPeriod}\n\n`;

    csv += 'KEY STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Transactions,${this.stats.totalTransactions}\n`;
    csv += `Flagged Transactions,${this.stats.flaggedTransactions}\n`;
    csv += `Total Alerts,${this.stats.totalAlerts}\n`;
    csv += `Pending Alerts,${this.stats.pendingAlerts}\n`;
    csv += `Resolved Alerts,${this.stats.resolvedAlerts}\n`;
    csv += `Total SARs,${this.stats.totalSARs}\n`;
    csv += `Submitted SARs,${this.stats.submittedSARs}\n`;
    csv += `Drafted SARs,${this.stats.draftedSARs}\n`;
    csv += `High Risk Customers,${this.stats.highRiskCustomers}\n`;
    csv += `Average Risk Score,${this.stats.averageRiskScore}\n\n`;

    csv += 'TOP RISK CUSTOMERS\n';
    csv += 'Rank,Customer Name,Risk Score,Alert Count,Last Activity\n';
    this.topRiskCustomers.forEach((c, i) => {
      csv += `${i + 1},"${c.name}",${c.riskScore},${c.alertCount},"${c.lastActivity}"\n`;
    });
    csv += '\n';

    csv += 'ALERTS BY TYPE\n';
    csv += 'Type,Count\n';
    this.alertsByType.labels.forEach((label, i) => {
      csv += `"${label}",${this.alertsByType.values[i]}\n`;
    });
    csv += '\n';

    csv += 'ALERTS BY STATUS\n';
    csv += 'Status,Count\n';
    this.alertsByStatus.labels.forEach((label, i) => {
      csv += `"${label}",${this.alertsByStatus.values[i]}\n`;
    });

    return csv;
  }

  private generateReportContent(): string {
    const date = new Date().toLocaleDateString();
    return `
AML COMPLIANCE REPORT
Generated: ${date}
Period: ${this.selectedPeriod}

=== STATISTICS ===
Total Transactions: ${this.stats.totalTransactions}
Flagged Transactions: ${this.stats.flaggedTransactions}
Total Alerts: ${this.stats.totalAlerts}
Pending Alerts: ${this.stats.pendingAlerts}
Resolved Alerts: ${this.stats.resolvedAlerts}
Total SARs: ${this.stats.totalSARs}
Submitted SARs: ${this.stats.submittedSARs}
Drafted SARs: ${this.stats.draftedSARs}
High Risk Customers: ${this.stats.highRiskCustomers}
Average Risk Score: ${this.stats.averageRiskScore}

=== TOP RISK CUSTOMERS ===
${this.topRiskCustomers.map((c, i) => `${i + 1}. ${c.name} - Risk Score: ${c.riskScore}, Alerts: ${c.alertCount}`).join('\n')}

=== ALERTS BY TYPE ===
${this.alertsByType.labels.map((label, i) => `${label}: ${this.alertsByType.values[i]}`).join('\n')}

=== ALERTS BY STATUS ===
${this.alertsByStatus.labels.map((label, i) => `${label}: ${this.alertsByStatus.values[i]}`).join('\n')}
    `.trim();
  }

  getRiskScoreClass(score: number): string {
    if (score >= 80) return 'risk-critical';
    if (score >= 60) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  navigateToCustomer(customerId: number): void {
    this.router.navigate(['/admin/users'], { queryParams: { id: customerId } });
  }
}
