import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrencyRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  conversionRate: number;
  conversionFeePercent: number;
  minimumFee: number;
  maximumFee: number;
  isActive: boolean;
  rateSource: string;
  createdAt: string;
  lastUpdated: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  conversionFee: number;
  netAmount: number;
  conversionId: string;
  conversionTime: string;
  rateSource: string;
  currencyExchange: CurrencyRate;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private API_URL = `${environment.apiUrl}/currency`;

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  // Get supported currencies
  getSupportedCurrencies(): Observable<string[]> {
    const url = `${this.API_URL}/supported`;
    console.log('CurrencyService: Calling getSupportedCurrencies:', url);
    
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      map((response: any) => {
        console.log('CurrencyService: getSupportedCurrencies response:', response);
        // Handle different response formats
        return response.data || response || [];
      }),
      catchError((error) => {
        console.error('CurrencyService: getSupportedCurrencies error:', error);
        return throwError(() => error);
      })
    );
  }

  // Get currency rates
  getCurrencyRates(fromCurrency?: string, toCurrency?: string): Observable<CurrencyRate[]> {
    const url = `${this.API_URL}/rates`;
    console.log('CurrencyService: Calling getCurrencyRates:', url);
    
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      map((response: any) => {
        console.log('CurrencyService: getCurrencyRates response:', response);
        let rates = response.data || response || [];
        
        // Filter rates if specific currencies are requested
        if (fromCurrency || toCurrency) {
          rates = rates.filter((rate: any) => {
            const matchesFrom = !fromCurrency || rate.fromCurrency === fromCurrency;
            const matchesToCurrency = !toCurrency || rate.toCurrency === toCurrency;
            return matchesFrom && matchesToCurrency;
          });
        }
        
        return rates;
      }),
      catchError((error) => {
        console.error('CurrencyService: getCurrencyRates error:', error);
        return throwError(() => error);
      })
    );
  }

  // Convert currency
  convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Observable<CurrencyConversion> {
    const url = `${this.API_URL}/convert`;
    const params = new URLSearchParams();
    params.set('fromCurrency', fromCurrency);
    params.set('toCurrency', toCurrency);
    params.set('amount', amount.toString());
    
    console.log('CurrencyService: Calling convertCurrency (POST):', url);
    console.log('CurrencyService: Parameters:', { fromCurrency, toCurrency, amount });
    
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      })
    };
    
    return this.http.post<any>(url, params.toString(), options).pipe(
      map((response: any) => {
        console.log('CurrencyService: convertCurrency response:', response);
        // Handle different response formats
        return response.data || response;
      }),
      catchError((error) => {
        console.error('CurrencyService: convertCurrency error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }
}
