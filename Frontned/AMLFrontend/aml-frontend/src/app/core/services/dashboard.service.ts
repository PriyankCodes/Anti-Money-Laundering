import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardStats, Transaction, Alert, CustomerProfile, Account } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Dashboard Statistics - combining transaction counts and current user data
  getDashboardStats(): Observable<DashboardStats> {
    const lastLogin = localStorage.getItem('lastLogin') || new Date().toISOString();
    
    // Fetch both transactions and accounts to calculate stats
    return this.http.get<any>(`${this.API_URL}/customers/transactions`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        
        // Calculate pending transactions (PENDING, FLAGGED, BLOCKED)
        const pendingCount = transactions.filter((t: any) => 
          t.status === 'PENDING' || t.status === 'FLAGGED' || t.status === 'BLOCKED'
        ).length;
        
        // Fetch accounts count separately
        this.getCustomerAccounts().subscribe(accounts => {
          // This will be used to update the UI
        });
        
        return {
          totalTransactions: transactions.length || 0,
          pendingTransactions: pendingCount,
          totalAccounts: 0, // Will be updated separately
          lastLogin: lastLogin
        };
      })
    );
  }

  // Customer Profile
  getCustomerProfile(): Observable<CustomerProfile> {
    return this.http.get<any>(`${this.API_URL}/customers/profile`, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  updateCustomerProfile(profile: Partial<CustomerProfile>): Observable<CustomerProfile> {
    return this.http.put<any>(`${this.API_URL}/customers/profile`, profile, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  // Accounts
  getCustomerAccounts(): Observable<Account[]> {
    return this.http.get<any>(`${this.API_URL}/customers/accounts`, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  createAccount(accountData: any): Observable<Account> {
    return this.http.post<any>(`${this.API_URL}/customers/accounts`, accountData, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  getAccountById(accountId: number): Observable<Account> {
    return this.http.get<Account>(`${this.API_URL}/customers/accounts/${accountId}`, this.getHttpOptions());
  }

  // Transactions
  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        return transactions.slice(0, limit);
      })
    );
  }

  getAllTransactions(page: number = 0, size: number = 20): Observable<{content: Transaction[], totalElements: number}> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        const start = page * size;
        const end = start + size;
        return {
          content: transactions.slice(start, end),
          totalElements: transactions.length
        };
      })
    );
  }

  getTransactionById(transactionId: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.API_URL}/customers/transactions/${transactionId}`, this.getHttpOptions());
  }

  // Alerts
  getRecentAlerts(limit: number = 10): Observable<Alert[]> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const alerts = response.data || response;
        return alerts.slice(0, limit);
      })
    );
  }

  getAllAlerts(page: number = 0, size: number = 20): Observable<{content: Alert[], totalElements: number}> {
    return this.http.get<any>(`${this.API_URL}/customers/alerts`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const alerts = response.data || response;
        const start = page * size;
        const end = start + size;
        return {
          content: alerts.slice(start, end),
          totalElements: alerts.length
        };
      })
    );
  }

  getAlertById(alertId: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.API_URL}/customers/alerts/${alertId}`, this.getHttpOptions());
  }

  // KYC Document Upload
  uploadKycDocument(file: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.post(`${this.API_URL}/customers/kyc/upload`, formData, { headers });
  }

  getKycDocuments(): Observable<any[]> {
    return this.http.get<any>(`${this.API_URL}/customers/kyc-documents`, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
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
}
