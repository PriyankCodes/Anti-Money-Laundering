import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Keyword, KeywordCreateRequest, KeywordUpdateRequest } from '../models/keyword.models';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService
  ) {}

  // Get all keywords
  getKeywords(): Observable<Keyword[]> {
    return this.http.get<any>(`${this.API_URL}/admin/keywords`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle different response formats
        let keywordsData: any[] = [];
        if (Array.isArray(response)) {
          keywordsData = response;
        } else if (response && Array.isArray(response.data)) {
          keywordsData = response.data;
        } else if (response && Array.isArray(response.content)) {
          keywordsData = response.content;
        } else if (response && Array.isArray(response.keywords)) {
          keywordsData = response.keywords;
        }

        return keywordsData.map(keyword => this.mapToKeyword(keyword));
      })
    );
  }

  // Get keyword by ID
  getKeywordById(id: number): Observable<Keyword> {
    return this.http.get<any>(`${this.API_URL}/admin/keywords/${id}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const keywordData = response.data || response;
        return this.mapToKeyword(keywordData);
      })
    );
  }

  // Create new keyword
  createKeyword(keywordData: KeywordCreateRequest): Observable<Keyword> {
    const payload = {
      word: keywordData.keyword,  // Backend expects 'word'
      category: keywordData.category || 'OTHER',
      severity: keywordData.severity || 50,
      active: true  // Backend expects 'active' (boolean)
    };
    
    console.log('Creating keyword with payload:', payload);
    
    return this.http.post<any>(`${this.API_URL}/admin/keywords`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        console.log('Create keyword response:', response);
        const responseData = response.data || response;
        return this.mapToKeyword(responseData);
      }),
      catchError(error => {
        console.error('Keyword create failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        console.error('Full error:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Update keyword
  updateKeyword(id: number, keywordData: KeywordUpdateRequest): Observable<Keyword> {
    const payload = {
      word: keywordData.keyword,  // Backend expects 'word'
      category: keywordData.category || 'OTHER',
      severity: keywordData.severity || 50,
      active: keywordData.isActive !== undefined ? keywordData.isActive : true  // Backend expects 'active'
    };
    
    console.log(`Updating keyword ${id} with payload:`, payload);
    
    return this.http.put<any>(`${this.API_URL}/admin/keywords/${id}`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        console.log('Update keyword response:', response);
        const responseData = response.data || response;
        return this.mapToKeyword(responseData);
      }),
      catchError(error => {
        console.error('Keyword update failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        console.error('Full error:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Delete keyword (soft delete by setting isActive to false)
  deleteKeyword(id: number): Observable<void> {
    console.log(`Deleting keyword ${id}`);
    return this.http.delete<void>(`${this.API_URL}/admin/keywords/${id}`, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Keyword delete failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        console.error('Full error:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Toggle keyword status
  toggleKeywordStatus(id: number, isActive: boolean): Observable<Keyword> {
    console.log(`Toggling keyword ${id} status to:`, isActive);
    // Backend requires all fields for update, so fetch current keyword first
    return this.getKeywordById(id).pipe(
      switchMap((currentKeyword: Keyword) => {
        const payload = {
          word: currentKeyword.keyword,
          category: currentKeyword.category,
          severity: currentKeyword.severity,
          active: isActive
        };
        console.log('Toggle status payload:', payload);
        return this.http.put<any>(`${this.API_URL}/admin/keywords/${id}`, payload, this.getHttpOptions());
      }),
      map((response: any) => {
        console.log('Toggle status response:', response);
        const keywordData = response.data || response;
        return this.mapToKeyword(keywordData);
      }),
      catchError(error => {
        console.error('Keyword status toggle failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        console.error('Full error:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Helper method to map API response to Keyword interface
  private mapToKeyword(data: any): Keyword {
    const mapped = {
      id: data.id || data.keywordId,
      keyword: data.word || data.keyword || data.keywordText || '',  // Backend returns 'word'
      category: data.category || data.keywordCategory || 'OTHER',
      severity: data.severity || data.riskLevel || 50,
      description: data.description || data.desc || '',
      isActive: data.active !== undefined ? data.active : (data.isActive !== false && data.status !== 'INACTIVE'),  // Backend returns 'active'
      createdAt: data.createdAt || data.dateCreated,
      updatedAt: data.updatedAt || data.dateUpdated
    };
    return mapped;
  }


  // Helper methods
  private getHttpOptions() {
    return this.authTokenService.getHttpOptions();
  }
}
