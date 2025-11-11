import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplianceService, Alert } from '../../../core/services/compliance.service';

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  date?: string;
}

interface StatusTrendData {
  open: ChartDataPoint[];
  investigating: ChartDataPoint[];
  resolved: ChartDataPoint[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isLoading = true;
  stats = {
    totalAlerts: 0,
    openAlerts: 0,
    assignedToMe: 0,
    highRiskAlerts: 0,
    totalSARs: 0,
    pendingSARs: 0
  };
  recentAlerts: Alert[] = [];
  selectedAlert: Alert | null = null;
  successMessage = '';
  errorMessage = '';
  
  // Chart data
  alertTrendData: ChartDataPoint[] = [];
  statusTrendData: StatusTrendData = {
    open: [],
    investigating: [],
    resolved: []
  };
  maxAlertCount = 100;
  maxStatusCount = 40;
  
  // Tooltip state
  tooltip = {
    visible: false,
    x: 0,
    y: 0,
    content: '',
    title: ''
  };

  constructor(
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load all alerts to calculate stats and chart data
    this.complianceService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.stats.totalAlerts = alerts.length;
        this.stats.openAlerts = alerts.filter(a => a.status === 'OPEN').length;
        this.stats.highRiskAlerts = alerts.filter(a => a.riskScore >= 70).length;
        
        // Get most recent 10 alerts
        this.recentAlerts = alerts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);
        
        // Process data for charts
        this.processAlertTrendData(alerts);
        this.processStatusTrendData(alerts);
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.errorMessage = 'Failed to load dashboard data. Please try again.';
      }
    });

    // Load assigned alerts
    this.complianceService.getMyAssignedAlerts().subscribe({
      next: (alerts) => {
        this.stats.assignedToMe = alerts.length;
      },
      error: (error) => {
        console.error('Error loading assigned alerts:', error);
      }
    });

    // Load SARs
    this.complianceService.getAllSARs().subscribe({
      next: (sars) => {
        this.stats.totalSARs = sars.length;
        this.stats.pendingSARs = sars.filter(s => s.status === 'DRAFT' || s.status === 'PENDING').length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SARs:', error);
        this.isLoading = false;
      }
    });
  }

  processAlertTrendData(alerts: Alert[]): void {
    // Group alerts by day for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Create buckets for each day
    const dailyCounts: { [key: string]: number } = {};
    
    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyCounts[dateKey] = 0;
    }
    
    // Count alerts per day
    alerts.forEach(alert => {
      const alertDate = new Date(alert.createdAt);
      if (alertDate >= thirtyDaysAgo) {
        const dateKey = alertDate.toISOString().split('T')[0];
        if (dailyCounts[dateKey] !== undefined) {
          dailyCounts[dateKey]++;
        }
      }
    });
    
    // Convert to chart data points (sample every 5 days for cleaner visualization)
    this.alertTrendData = [];
    const dates = Object.keys(dailyCounts).sort();
    const sampleIndices = [0, 6, 13, 20, 27, 29]; // Day 1, 7, 14, 21, 28, 30
    
    sampleIndices.forEach((index, i) => {
      if (index < dates.length) {
        const count = dailyCounts[dates[index]];
        const date = new Date(dates[index]);
        this.alertTrendData.push({
          x: 50 + (i * 100), // X position on SVG
          y: 250 - (count * 2), // Y position (inverted, scaled)
          label: `Day ${index + 1}`,
          value: count,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    });
    
    // Calculate max for scaling
    const maxCount = Math.max(...Object.values(dailyCounts), 1);
    this.maxAlertCount = Math.ceil(maxCount / 25) * 25; // Round up to nearest 25
    
    // Rescale Y values
    this.alertTrendData.forEach(point => {
      const originalCount = (250 - point.y) / 2;
      point.y = 250 - (originalCount / this.maxAlertCount) * 200;
    });
  }

  processStatusTrendData(alerts: Alert[]): void {
    // Group alerts by week and status for the last 4 weeks
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    // Create buckets for each week
    const weeklyCounts: { [key: number]: { open: number, investigating: number, resolved: number } } = {
      0: { open: 0, investigating: 0, resolved: 0 },
      1: { open: 0, investigating: 0, resolved: 0 },
      2: { open: 0, investigating: 0, resolved: 0 },
      3: { open: 0, investigating: 0, resolved: 0 }
    };
    
    // Count alerts per week by status
    alerts.forEach(alert => {
      const alertDate = new Date(alert.createdAt);
      if (alertDate >= fourWeeksAgo) {
        const daysDiff = Math.floor((now.getTime() - alertDate.getTime()) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.min(Math.floor(daysDiff / 7), 3);
        
        if (alert.status === 'OPEN') {
          weeklyCounts[weekIndex].open++;
        } else if (alert.status === 'INVESTIGATING') {
          weeklyCounts[weekIndex].investigating++;
        } else if (alert.status === 'TRUE_POSITIVE' || alert.status === 'FALSE_POSITIVE' || alert.status === 'CLOSED') {
          weeklyCounts[weekIndex].resolved++;
        }
      }
    });
    
    // Convert to chart data points
    const xPositions = [50, 200, 350, 500];
    
    this.statusTrendData.open = [];
    this.statusTrendData.investigating = [];
    this.statusTrendData.resolved = [];
    
    // Calculate max for scaling
    let maxCount = 1;
    Object.values(weeklyCounts).forEach(week => {
      maxCount = Math.max(maxCount, week.open, week.investigating, week.resolved);
    });
    this.maxStatusCount = Math.ceil(maxCount / 10) * 10; // Round up to nearest 10
    
    // Create data points for each status
    for (let i = 0; i < 4; i++) {
      const week = weeklyCounts[3 - i]; // Reverse order (oldest to newest)
      
      this.statusTrendData.open.push({
        x: xPositions[i],
        y: 250 - (week.open / this.maxStatusCount) * 200,
        label: `Week ${i + 1}`,
        value: week.open
      });
      
      this.statusTrendData.investigating.push({
        x: xPositions[i],
        y: 250 - (week.investigating / this.maxStatusCount) * 200,
        label: `Week ${i + 1}`,
        value: week.investigating
      });
      
      this.statusTrendData.resolved.push({
        x: xPositions[i],
        y: 250 - (week.resolved / this.maxStatusCount) * 200,
        label: `Week ${i + 1}`,
        value: week.resolved
      });
    }
  }

  getAlertTrendPolyline(): string {
    return this.alertTrendData.map(p => `${p.x},${p.y}`).join(' ');
  }

  getStatusTrendPolyline(status: 'open' | 'investigating' | 'resolved'): string {
    return this.statusTrendData[status].map(p => `${p.x},${p.y}`).join(' ');
  }

  showTooltip(event: MouseEvent, point: ChartDataPoint, chartType: string, status?: string): void {
    const svgElement = (event.target as SVGElement).ownerSVGElement;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    
    // Calculate tooltip position relative to the page
    this.tooltip.x = event.clientX;
    this.tooltip.y = event.clientY - 60;
    
    // Set tooltip content based on chart type
    if (chartType === 'alert') {
      this.tooltip.title = point.date || point.label;
      this.tooltip.content = `${point.value} Alert${point.value !== 1 ? 's' : ''}`;
    } else if (chartType === 'status') {
      this.tooltip.title = point.label;
      const statusLabel = status === 'open' ? 'Open' : status === 'investigating' ? 'Investigating' : 'Resolved';
      this.tooltip.content = `${statusLabel}: ${point.value}`;
    }
    
    this.tooltip.visible = true;
  }

  hideTooltip(): void {
    this.tooltip.visible = false;
  }

  viewAlertDetails(alert: Alert): void {
    this.selectedAlert = alert;
  }

  closeAlertModal(): void {
    this.selectedAlert = null;
  }

  assignAlert(alert: Alert): void {
    this.isLoading = true;
    this.complianceService.assignAlertToMe(alert.alertId).subscribe({
      next: (updatedAlert: Alert) => {
        this.successMessage = `Alert #${alert.alertId} has been assigned to you successfully!`;
        this.loadDashboardData();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error: any) => {
        console.error('Error assigning alert:', error);
        this.errorMessage = 'Failed to assign alert. Please try again.';
        this.isLoading = false;
        
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'INVESTIGATING': 'status-investigating',
      'TRUE_POSITIVE': 'status-positive',
      'FALSE_POSITIVE': 'status-negative',
      'ESCALATED': 'status-escalated',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-open';
  }

  getStatusDisplay(status: string): string {
    const displayMap: any = {
      'OPEN': 'Open',
      'INVESTIGATING': 'Investigating',
      'TRUE_POSITIVE': 'True Positive',
      'FALSE_POSITIVE': 'False Positive',
      'ESCALATED': 'Escalated',
      'CLOSED': 'Closed'
    };
    return displayMap[status] || status;
  }
}
