import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Rule, RuleCreateRequest, RuleUpdateRequest } from '../models/rule.models';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService
  ) {}

  // Get all rules
  getRules(): Observable<Rule[]> {
    return this.http.get<any>(`${this.API_URL}/admin/rules`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle different response formats
        let rulesData: any[] = [];
        if (Array.isArray(response)) {
          rulesData = response;
        } else if (response && Array.isArray(response.data)) {
          rulesData = response.data;
        } else if (response && Array.isArray(response.content)) {
          rulesData = response.content;
        } else if (response && Array.isArray(response.rules)) {
          rulesData = response.rules;
        }

        return rulesData.map(rule => this.mapToRule(rule));
      }),
      catchError(error => {
        console.error('Error loading rules:', error);
        return throwError(() => error);
      })
    );
  }

  // Get rule by ID
  getRuleById(id: number): Observable<Rule> {
    return this.http.get<any>(`${this.API_URL}/admin/rules/${id}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const ruleData = response.data || response;
        return this.mapToRule(ruleData);
      })
    );
  }

  // Create new rule
  createRule(ruleData: RuleCreateRequest): Observable<Rule> {
    const payload = {
      name: ruleData.name,
      type: ruleData.type,
      riskScoreImpact: ruleData.impact || 50,
      description: ruleData.description || null,
      conditions: ruleData.condition || null,
      active: true
    };
    
    return this.http.post<any>(`${this.API_URL}/admin/rules`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToRule(responseData);
      }),
      catchError(error => {
        console.error('Rule create failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Update rule
  updateRule(id: number, ruleData: RuleUpdateRequest): Observable<Rule> {
    const payload = {
      name: ruleData.name,
      type: ruleData.type,
      riskScoreImpact: ruleData.impact || 50,
      description: ruleData.description || null,
      conditions: ruleData.condition || null,
      active: ruleData.isActive !== undefined ? ruleData.isActive : true
    };
    
    return this.http.put<any>(`${this.API_URL}/admin/rules/${id}`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToRule(responseData);
      }),
      catchError(error => {
        console.error('Rule update failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete rule
  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/admin/rules/${id}`, this.getHttpOptions());
  }

  // Toggle rule status
  toggleRuleStatus(id: number, isActive: boolean): Observable<Rule> {
    return this.http.patch<any>(`${this.API_URL}/admin/rules/${id}/status`, 
      { active: isActive }, this.getHttpOptions()).pipe(
      map((response: any) => {
        const ruleData = response.data || response;
        return this.mapToRule(ruleData);
      })
    );
  }

  // Helper method to map API response to Rule interface
  private mapToRule(data: any): Rule {
    return {
      id: data.ruleId || data.id,
      name: data.name || '',
      type: data.type || 'PATTERN',
      impact: data.riskScoreImpact || data.impact || data.impactScore || data.severity || 50,
      isActive: data.active !== false && data.isActive !== false,
      description: data.description || '',
      condition: data.conditions || data.condition || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  // Helper methods
  private getHttpOptions() {
    return this.authTokenService.getHttpOptions();
  }
}
