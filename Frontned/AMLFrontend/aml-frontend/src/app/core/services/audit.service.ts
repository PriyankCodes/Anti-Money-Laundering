import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuditLog, AuditAction, AuditResourceType, AuditStatus } from '../models/audit.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private API_URL = 'http://localhost:8080/api/admin/audit';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    const token = localStorage.getItem('authToken');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Get all audit logs
  getAllAuditLogs(page: number = 0, size: number = 50): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.API_URL}/logs?page=${page}&size=${size}`,
      this.getHttpOptions()
    );
  }

  // Get audit log by ID
  getAuditLogById(logId: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(
      `${this.API_URL}/logs/${logId}`,
      this.getHttpOptions()
    );
  }

  // Utility methods for display
  getActionDisplay(action: AuditAction): string {
    const actionMap: { [key: string]: string } = {
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'REGISTER': 'Register',
      'ACCOUNT_CREATED': 'Account Created',
      'ACCOUNT_UPDATED': 'Account Updated',
      'ACCOUNT_DELETED': 'Account Deleted',
      'TRANSACTION_CREATED': 'Transaction Created',
      'TRANSACTION_APPROVED': 'Transaction Approved',
      'TRANSACTION_REJECTED': 'Transaction Rejected',
      'KYC_UPLOADED': 'KYC Uploaded',
      'KYC_VERIFIED': 'KYC Verified',
      'KYC_REJECTED': 'KYC Rejected',
      'RULE_CREATED': 'Rule Created',
      'RULE_UPDATED': 'Rule Updated',
      'RULE_DELETED': 'Rule Deleted',
      'DATA_VIEWED': 'Data Viewed',
      'DATA_EXPORTED': 'Data Exported',
      'PASSWORD_CHANGED': 'Password Changed',
      'PASSWORD_RESET': 'Password Reset'
    };
    return actionMap[action] || action;
  }

  getResourceTypeDisplay(resourceType: AuditResourceType): string {
    const resourceMap: { [key: string]: string } = {
      'USER': 'User',
      'ACCOUNT': 'Account',
      'TRANSACTION': 'Transaction',
      'KYC_DOCUMENT': 'KYC Document',
      'RULE': 'Rule',
      'AUDIT_LOG': 'Audit Log',
      'SYSTEM': 'System'
    };
    return resourceMap[resourceType] || resourceType;
  }

  getStatusDisplay(status: AuditStatus): string {
    const statusMap: { [key: string]: string } = {
      'SUCCESS': 'Success',
      'FAILURE': 'Failure',
      'PENDING': 'Pending'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: AuditStatus): string {
    const statusClassMap: { [key: string]: string } = {
      'SUCCESS': 'status-success',
      'FAILURE': 'status-rejected',
      'PENDING': 'status-pending'
    };
    return statusClassMap[status] || 'status-pending';
  }

  getActionClass(action: AuditAction): string {
    if (action.includes('LOGIN') || action.includes('REGISTER')) {
      return 'action-auth';
    } else if (action.includes('CREATED')) {
      return 'action-create';
    } else if (action.includes('UPDATED')) {
      return 'action-update';
    } else if (action.includes('DELETED') || action.includes('REJECTED')) {
      return 'action-delete';
    } else if (action.includes('APPROVED') || action.includes('VERIFIED')) {
      return 'action-approve';
    }
    return 'action-default';
  }
}
