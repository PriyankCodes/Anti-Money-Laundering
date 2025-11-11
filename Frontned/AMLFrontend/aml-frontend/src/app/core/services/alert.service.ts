import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AlertNotification {
  id: number;
  transactionId: string;
  amount: number;
  date: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'FLAGGED' | 'CANCELED' | 'OPEN' | 'NEW' | 'CLOSED' | 'COMPLETED' | 'INVESTIGATING' | 'IN_PROGRESS' | 'TRUE_POSITIVE' | 'FALSE_POSITIVE';
  type: 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  createdAt?: string;
  assignedOfficer?: string;  // Name of the assigned compliance officer
}

export interface AlertStats {
  pending: number;
  resolved: number;
  total: number;
}

export interface CustomerTicket {
  ticketId: number;
  customerId: number;
  customerName: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedToId: number | null;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get all alerts for current customer
  getCustomerAlerts(): Observable<AlertNotification[]> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts`, this.getHttpOptions()).pipe(
      switchMap((response: any) => {
        // Handle ApiResponseDto wrapper
        const alerts = response.data || response;
        if (Array.isArray(alerts) && alerts.length > 0) {
          // Fetch transaction amounts for each alert
          return this.enrichAlertsWithTransactionAmounts(alerts);
        }
        
        // Return sample data for testing when no real alerts exist
        return of(this.getSampleAlerts());
      }),
      catchError((error) => {
        console.error('Error fetching customer alerts:', error);
        // Return sample data on error to prevent UI from breaking
        return of(this.getSampleAlerts());
      })
    );
  }

  // Enrich alerts with transaction amounts
  private enrichAlertsWithTransactionAmounts(alerts: any[]): Observable<AlertNotification[]> {
    const alertObservables = alerts.map(alert => {
      if (alert.transactionId) {
        return this.getTransactionAmount(alert.transactionId).pipe(
          map(amount => ({
            ...alert,
            transactionAmount: amount
          })),
          catchError(() => of({
            ...alert
          }))
        );
      } else {
        return of({
          ...alert        });
      }
    });

    return forkJoin(alertObservables).pipe(
      map((enrichedAlerts: any[]) => enrichedAlerts.map((alert: any) => this.mapToAlert(alert)))
    );
  }

  // Get transaction amount by transaction ID
  private getTransactionAmount(transactionId: string): Observable<number> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        if (Array.isArray(transactions)) {
          const transaction = transactions.find(t => t.transactionId === transactionId);
          return transaction ? (transaction.amount || 0) : 0;
        }
        return 0;
      })
    );
  }

  // Sample alerts for testing
  private getSampleAlerts(): AlertNotification[] {
    return [];
  }

  // Get alert statistics - calculated from alerts since no stats endpoint exists
  getAlertStats(): Observable<AlertStats> {
    return this.getCustomerAlerts().pipe(
      map((alerts: AlertNotification[]) => {
        const pending = alerts.filter(a => 
          a.status === 'PENDING' || a.status === 'OPEN' || a.status === 'NEW'
        ).length;
        const resolved = alerts.filter(a => 
          a.status === 'RESOLVED' || a.status === 'CLOSED' || a.status === 'COMPLETED'
        ).length;
        
        return {
          pending: pending,
          resolved: resolved,
          total: alerts.length
        };
      })
    );
  }

  // Get alert by ID
  getAlertById(alertId: number): Observable<AlertNotification> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts/${alertId}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle ApiResponseDto wrapper
        const alertData = response.data || response;
        return this.mapToAlert(alertData);
      })
    );
  }

  // Contact support about an alert - using helpdesk endpoint
  contactSupport(alertId: number, message: string, alert?: AlertNotification): Observable<any> {
    const ticketRequest = {
      subject: `Alert Inquiry - Transaction ${alert?.transactionId || 'ID: ' + alertId}`,
      description: this.buildCustomerTicketDescription(alert, message),
      priority: this.determineTicketPriority(alert?.severity),
      alertId: alertId  // Link ticket to the alert
    };
    
    console.log('Creating ticket with request:', ticketRequest);
    
    return this.http.post<any>(
      `${this.API_URL}/customers/helpdesk/tickets`,
      ticketRequest,
      this.getHttpOptions()
    );
  }

  // Build simplified ticket description for customer view (no Reason, Severity, Action Required)
  private buildCustomerTicketDescription(alert: AlertNotification | undefined, customerMessage: string): string {
    if (!alert) {
      return `Customer Inquiry:\n${customerMessage}`;
    }

    return `ALERT INQUIRY - Customer needs clarification

ALERT DETAILS:
- Alert ID: ${alert.id}
- Transaction ID: ${alert.transactionId}
- Amount: ${this.formatCurrency(alert.amount)}
- Status: ${alert.status}
- Date: ${alert.date}

CUSTOMER MESSAGE:
${customerMessage}`;
  }

  // Build detailed ticket description for compliance officers (includes all details)
  private buildComplianceTicketDescription(alert: AlertNotification | undefined, customerMessage: string): string {
    if (!alert) {
      return `Customer Inquiry:\n${customerMessage}`;
    }

    return `ALERT INQUIRY - Customer needs clarification

ALERT DETAILS:
- Alert ID: ${alert.id}
- Transaction ID: ${alert.transactionId}
- Amount: ${this.formatCurrency(alert.amount)}
- Status: ${alert.status}
- Reason: ${alert.reason}
- Severity: ${alert.severity}
- Date: ${alert.date}

CUSTOMER MESSAGE:
${customerMessage}

ACTION REQUIRED:
Please review the alert and provide explanation to the customer about why this transaction was flagged/blocked.`;
  }

  // Determine ticket priority based on alert severity
  private determineTicketPriority(severity?: string): string {
    switch (severity) {
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  // Format currency for ticket description
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Helper method to map API response to AlertNotification interface
  private mapToAlert(data: any): AlertNotification {
    // Use the fetched transaction amount or fallback to demo amount
    const amount = data.transactionAmount || data.amount || 0;
    
    // Clean up rule triggered text - remove duplicate descriptions
    const ruleText = data.ruleTriggered || data.reason || 'Flagged for review';
    const cleanReason = this.cleanRuleDescription(ruleText);

    return {
      id: data.alertId || data.id,
      transactionId: data.transactionId || 'N/A',
      amount: amount,
      date: data.createdAt || data.timestamp,
      reason: cleanReason,
      status: data.status || 'PENDING',
      type: this.determineTypeFromStatus(data.status),
      severity: this.determineSeverityFromRiskScore(data.riskScore),
      description: data.description || '',
      createdAt: data.createdAt,
      assignedOfficer: data.assignedOfficerName || data.assignedToOfficer || null
    };
  }
  
  // Clean up rule description to remove duplicates and format nicely
  private cleanRuleDescription(text: string): string {
    if (!text) return 'Flagged for review';
    
    // Split by comma and remove duplicates
    const parts = text.split(',').map(p => p.trim());
    const uniqueParts = [...new Set(parts)];
    
    // Join with proper formatting
    return uniqueParts.join(', ');
  }


  // Determine alert type from status
  private determineTypeFromStatus(status: string): 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS' {
    if (status === 'CANCELED' || status === 'CANCELLED') return 'CANCELED';
    if (status === 'HIGH_RISK') return 'SUSPICIOUS';
    return 'FLAGGED';
  }

  // Determine severity from risk score
  private determineSeverityFromRiskScore(riskScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (riskScore >= 80) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
  }

  // Determine alert type from data
  private determineType(data: any): 'FLAGGED' | 'CANCELED' | 'SUSPICIOUS' {
    if (data.type) return data.type;
    if (data.status === 'CANCELED') return 'CANCELED';
    if (data.severity === 'HIGH') return 'SUSPICIOUS';
    return 'FLAGGED';
  }

  // Helper methods
  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get all tickets for current customer
  getCustomerTickets(): Observable<CustomerTicket[]> {
    return this.http.get<any>(`${this.API_URL}/customers/helpdesk/tickets`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle ApiResponseDto wrapper
        const tickets = response.data || response;
        return Array.isArray(tickets) ? tickets : [];
      }),
      catchError((error) => {
        console.error('Error fetching customer tickets:', error);
        return of([]);
      })
    );
  }

  // Update ticket description
  updateTicketDescription(ticketId: number, description: string): Observable<CustomerTicket> {
    return this.http.put<any>(
      `${this.API_URL}/customers/helpdesk/tickets/${ticketId}`,
      description,
      this.getHttpOptions()
    ).pipe(
      map((response: any) => response.data || response)
    );
  }
}
