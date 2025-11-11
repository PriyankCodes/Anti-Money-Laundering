import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  KycDocument, 
  KycDocumentSummary, 
  KycStatusSummary, 
  KycDocumentUploadRequest,
  KycDocumentVerificationRequest,
  ApiResponse,
  DocumentType,
  KycStatus
} from '../models/kyc.models';

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private readonly API_URL = `${environment.apiUrl}/kyc`;

  constructor(private http: HttpClient) {}

  // Upload document
  uploadDocument(customerId: number, documentType: DocumentType, file: File): Observable<KycDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customerId', customerId.toString());
    formData.append('documentType', documentType);

    return this.http.post<ApiResponse<KycDocument>>(`${this.API_URL}/upload`, formData, this.getHttpOptions(true)).pipe(
      map((response: ApiResponse<KycDocument>) => response.data)
    );
  }

  // Get customer documents
  getCustomerDocuments(customerId: number): Observable<KycDocumentSummary[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/customer/${customerId}`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<any[]>) => {
        const documents = response.data || [];
        console.log('Raw backend response for documents:', documents);
        
        // Map backend response to frontend model
        return documents.map((doc: any) => ({
          id: doc.id,
          documentType: doc.documentType,
          status: doc.status,
          fileName: doc.fileName,
          // Backend might use different field names for file path
          filePath: doc.filePath || doc.fileUrl || doc.url || doc.documentUrl || doc.path,
          uploadTimestamp: doc.uploadTimestamp,
          riskScore: doc.riskScore
        } as KycDocumentSummary));
      })
    );
  }

  // Get customer KYC status
  getCustomerKycStatus(customerId: number): Observable<KycStatusSummary> {
    return this.http.get<ApiResponse<KycStatusSummary>>(`${this.API_URL}/customer/${customerId}/status`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycStatusSummary>) => response.data)
    );
  }

  // Get document by ID
  getDocumentById(documentId: number): Observable<KycDocument> {
    return this.http.get<ApiResponse<KycDocument>>(`${this.API_URL}/${documentId}`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument>) => response.data)
    );
  }

  // Verify document (for compliance officers)
  verifyDocument(request: KycDocumentVerificationRequest): Observable<KycDocument> {
    return this.http.post<ApiResponse<KycDocument>>(`${this.API_URL}/verify`, request, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument>) => response.data)
    );
  }

  // Get pending documents (for compliance officers)
  getPendingDocuments(): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/pending`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Get all documents (for admin review)
  getAllDocuments(): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/all`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Get documents by status
  getDocumentsByStatus(status: KycStatus): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/status/${status}`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Get documents requiring manual review
  getDocumentsRequiringManualReview(): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/manual-review`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Get high risk documents
  getHighRiskDocuments(minRiskScore: number = 70): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/high-risk?minRiskScore=${minRiskScore}`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Update risk score
  updateRiskScore(documentId: number, riskScore: number): Observable<KycDocument> {
    return this.http.put<ApiResponse<KycDocument>>(`${this.API_URL}/${documentId}/risk-score?riskScore=${riskScore}`, {}, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument>) => response.data)
    );
  }

  // Delete document
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${documentId}`, this.getHttpOptions()).pipe(
      map(() => void 0)
    );
  }

  // Get documents by date range
  getDocumentsByDateRange(startDate: string, endDate: string): Observable<KycDocument[]> {
    return this.http.get<ApiResponse<KycDocument[]>>(`${this.API_URL}/reports/date-range?startDate=${startDate}&endDate=${endDate}`, this.getHttpOptions()).pipe(
      map((response: ApiResponse<KycDocument[]>) => response.data || [])
    );
  }

  // Helper methods
  private getHttpOptions(isFileUpload: boolean = false) {
    const token = this.getToken();
    const headers: any = {
      'Authorization': token ? `Bearer ${token}` : ''
    };

    // Don't set Content-Type for file uploads, let browser set it with boundary
    if (!isFileUpload) {
      headers['Content-Type'] = 'application/json';
    }

    return {
      headers: new HttpHeaders(headers)
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Utility methods
  getDocumentTypeDisplay(type: DocumentType): string {
    switch (type) {
      case DocumentType.PASSPORT: return 'Passport';
      case DocumentType.PAN: return 'PAN Card';
      case DocumentType.AADHAAR: return 'Aadhaar Card';
      case DocumentType.DRIVING_LICENSE: return 'Driving License';
      case DocumentType.VOTER_ID: return 'Voter ID';
      default: return type;
    }
  }

  getStatusDisplay(status: KycStatus): string {
    switch (status) {
      case KycStatus.PENDING: return 'Pending';
      case KycStatus.VERIFIED: return 'Verified';
      case KycStatus.REJECTED: return 'Rejected';
      default: return status;
    }
  }

  getStatusClass(status: KycStatus): string {
    switch (status) {
      case KycStatus.VERIFIED: return 'status-verified';
      case KycStatus.PENDING: return 'status-pending';
      case KycStatus.REJECTED: return 'status-rejected';
      default: return 'status-unknown';
    }
  }

  getRiskScoreClass(riskScore?: number): string {
    if (!riskScore) return 'risk-low';
    if (riskScore >= 80) return 'risk-critical';
    if (riskScore >= 70) return 'risk-high';
    if (riskScore >= 40) return 'risk-medium';
    return 'risk-low';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
