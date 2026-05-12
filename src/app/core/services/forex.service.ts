import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ForexRate {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  change: number;
  changePercent: number;
}

const MOCK_FOREX: ForexRate[] = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD', rate: 1.0842, change: 0.0023, changePercent: 0.21 },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD', rate: 1.2654, change: -0.0015, changePercent: -0.12 },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY', rate: 151.42, change: 0.38, changePercent: 0.25 },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF', rate: 0.8972, change: -0.0008, changePercent: -0.09 },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD', rate: 0.6524, change: 0.0012, changePercent: 0.18 },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD', rate: 1.3562, change: 0.0045, changePercent: 0.33 },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD', rate: 0.6012, change: -0.0008, changePercent: -0.13 },
  { pair: 'USD/PKR', base: 'USD', quote: 'PKR', rate: 278.45, change: 0.85, changePercent: 0.31 },
];

@Injectable({ providedIn: 'root' })
export class ForexService {
  constructor(private http: HttpClient) {}

  getForexRates(): Observable<ForexRate[]> {
    return of(MOCK_FOREX.map(r => ({
      ...r,
      rate: +(r.rate * (1 + (Math.random() - 0.5) * 0.002)).toFixed(4),
      changePercent: +(r.changePercent + (Math.random() - 0.5) * 0.1).toFixed(2),
    })));
  }
}
