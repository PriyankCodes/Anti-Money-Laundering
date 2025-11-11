import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionCreateRequest } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get all transactions with pagination
  getAllTransactions(page: number = 0, size: number = 20): Observable<{content: Transaction[], totalElements: number}> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions?page=${page}&size=${size}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const transactions = response.data || response;
        if (Array.isArray(transactions)) {
          return {
            content: transactions,
            totalElements: transactions.length
          };
        }
        return response;
      })
    );
  }

  // Get transaction by ID
  getTransactionById(transactionId: number): Observable<Transaction> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions/${transactionId}`, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  // Create new transaction (transfer)
  createTransaction(transactionData: TransactionCreateRequest): Observable<Transaction> {
    return this.http.post<any>(`${this.API_URL}/transactions/transfer`, transactionData, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  // Create deposit transaction - Use dedicated deposit endpoint
  createDeposit(depositData: any): Observable<Transaction> {
    const depositPayload = {
      accountNumber: depositData.accountNumber,
      amount: depositData.amount,
      description: depositData.description || depositData.source || 'External deposit'
    };
    
    return this.http.post<any>(`${this.API_URL}/transactions/deposit`, depositPayload, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  // Create withdrawal transaction - Use dedicated withdrawal endpoint
  createWithdrawal(withdrawalData: any): Observable<Transaction> {
    const withdrawalPayload = {
      accountNumber: withdrawalData.accountNumber,
      amount: withdrawalData.amount,
      description: withdrawalData.description || withdrawalData.purpose || 'Cash withdrawal'
    };
    
    return this.http.post<any>(`${this.API_URL}/transactions/withdraw`, withdrawalPayload, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }


  // Search transactions by receiver or description
  searchTransactions(searchTerm: string): Observable<Transaction[]> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions/search?q=${searchTerm}`, this.getHttpOptions()).pipe(
      map((response: any) => response.data || response)
    );
  }

  // Filter transactions by status
  filterTransactionsByStatus(status: string): Observable<Transaction[]> {
    return this.http.get<any>(`${this.API_URL}/customers/transactions?status=${status}`, this.getHttpOptions()).pipe(
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
