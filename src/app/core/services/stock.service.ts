import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StockQuote, CompanyProfile, Mover, StockCandle } from '../models/stock.model';

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';

export interface ChartPoint { x: string; y: number; }
export interface OHLCPoint   { x: string; y: [number, number, number, number]; } // [O, H, L, C]

export interface ChartData {
  area:   ChartPoint[];
  candles: OHLCPoint[];
  volume:  { x: string; y: number }[];
  range:   ChartRange;
  symbol:  string;
}

const MOCK_QUOTES: Record<string, StockQuote> = {
  AAPL:  { symbol: 'AAPL',  name: 'Apple Inc.',      c: 189.84, d: 2.34,   dp: 1.25,  h: 191.05, l: 187.68, o: 188.10, pc: 187.50, t: Date.now() },
  MSFT:  { symbol: 'MSFT',  name: 'Microsoft',        c: 415.32, d: -1.78,  dp: -0.43, h: 418.00, l: 413.20, o: 417.00, pc: 417.10, t: Date.now() },
  TSLA:  { symbol: 'TSLA',  name: 'Tesla Inc.',        c: 248.16, d: 8.92,   dp: 3.73,  h: 250.00, l: 240.50, o: 241.00, pc: 239.24, t: Date.now() },
  NVDA:  { symbol: 'NVDA',  name: 'NVIDIA Corp',      c: 875.40, d: 22.60,  dp: 2.65,  h: 880.00, l: 860.00, o: 862.00, pc: 852.80, t: Date.now() },
  AMZN:  { symbol: 'AMZN',  name: 'Amazon.com',       c: 182.75, d: -0.85,  dp: -0.46, h: 185.00, l: 181.50, o: 183.80, pc: 183.60, t: Date.now() },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.',    c: 172.90, d: 1.20,   dp: 0.70,  h: 174.00, l: 171.00, o: 172.00, pc: 171.70, t: Date.now() },
  META:  { symbol: 'META',  name: 'Meta Platforms',   c: 492.50, d: 7.30,   dp: 1.51,  h: 495.00, l: 485.00, o: 486.00, pc: 485.20, t: Date.now() },
  NFLX:  { symbol: 'NFLX',  name: 'Netflix Inc.',     c: 628.40, d: -4.60,  dp: -0.73, h: 635.00, l: 625.00, o: 633.00, pc: 633.00, t: Date.now() },
  JPM:   { symbol: 'JPM',   name: 'JPMorgan Chase',   c: 198.20, d: 0.80,   dp: 0.40,  h: 199.50, l: 197.00, o: 197.50, pc: 197.40, t: Date.now() },
  BAC:   { symbol: 'BAC',   name: 'Bank of America',  c: 36.80,  d: -0.20,  dp: -0.54, h: 37.20,  l: 36.60,  o: 37.00,  pc: 37.00,  t: Date.now() },
  WMT:   { symbol: 'WMT',   name: 'Walmart Inc.',     c: 172.40, d: 1.10,   dp: 0.64,  h: 173.00, l: 171.50, o: 171.80, pc: 171.30, t: Date.now() },
  DIS:   { symbol: 'DIS',   name: 'Walt Disney Co.',  c: 113.60, d: -0.90,  dp: -0.79, h: 114.80, l: 113.20, o: 114.50, pc: 114.50, t: Date.now() },
  INTC:  { symbol: 'INTC',  name: 'Intel Corp',       c: 35.20,  d: 0.45,   dp: 1.29,  h: 35.60,  l: 34.90,  o: 34.95,  pc: 34.75,  t: Date.now() },
  PYPL:  { symbol: 'PYPL',  name: 'PayPal Holdings',  c: 62.80,  d: -1.20,  dp: -1.88, h: 64.20,  l: 62.50,  o: 63.90,  pc: 64.00,  t: Date.now() },
};

// Historical start prices for each symbol per range (simulates trend)
const HISTORY_START: Record<string, Record<ChartRange, number>> = {
  AAPL:  { '1D': 187.50, '1W': 183.20, '1M': 175.40, '3M': 165.80, '1Y': 152.00, '5Y': 98.00  },
  MSFT:  { '1D': 417.10, '1W': 408.50, '1M': 392.00, '3M': 372.00, '1Y': 320.00, '5Y': 185.00 },
  TSLA:  { '1D': 239.24, '1W': 228.00, '1M': 195.00, '3M': 175.00, '1Y': 155.00, '5Y': 40.00  },
  NVDA:  { '1D': 852.80, '1W': 820.00, '1M': 780.00, '3M': 680.00, '1Y': 475.00, '5Y': 120.00 },
  AMZN:  { '1D': 183.60, '1W': 179.50, '1M': 172.00, '3M': 158.00, '1Y': 138.00, '5Y': 88.00  },
  GOOGL: { '1D': 171.70, '1W': 168.00, '1M': 161.00, '3M': 152.00, '1Y': 130.00, '5Y': 75.00  },
  META:  { '1D': 485.20, '1W': 475.00, '1M': 455.00, '3M': 420.00, '1Y': 300.00, '5Y': 90.00  },
  NFLX:  { '1D': 633.00, '1W': 615.00, '1M': 590.00, '3M': 545.00, '1Y': 410.00, '5Y': 180.00 },
};

// Finnhub resolution codes per range
const RESOLUTION: Record<ChartRange, string> = {
  '1D': '5', '1W': '30', '1M': 'D', '3M': 'D', '1Y': 'W', '5Y': 'M'
};
const RANGE_SECONDS: Record<ChartRange, number> = {
  '1D': 86400, '1W': 604800, '1M': 2592000, '3M': 7776000, '1Y': 31536000, '5Y': 157680000
};

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly base = environment.finnhubBaseUrl;
  private readonly key  = environment.finnhubApiKey;

  constructor(private http: HttpClient) {}

  // ─── Quote ────────────────────────────────────────────────────────────────
  getQuote(symbol: string): Observable<StockQuote> {
    if (this.key === 'demo') {
      const q = MOCK_QUOTES[symbol.toUpperCase()];
      if (q) {
        const v = (Math.random() - 0.5) * 0.5;
        return of({ ...q, c: +(q.c + v).toFixed(2), d: +(q.d + v / 2).toFixed(2) });
      }
      return of({ symbol, c: 100, d: 0, dp: 0, h: 105, l: 95, o: 100, pc: 100, t: Date.now() });
    }
    const params = new HttpParams().set('symbol', symbol).set('token', this.key);
    return this.http.get<StockQuote>(`${this.base}/quote`, { params }).pipe(
      map(q => ({ ...q, symbol })),
      catchError(() => of(MOCK_QUOTES[symbol.toUpperCase()] ?? { symbol, c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 }))
    );
  }

  getMultipleQuotes(symbols: string[]): Observable<StockQuote[]> {
    return forkJoin(symbols.map(s => this.getQuote(s)));
  }

  getCompanyProfile(symbol: string): Observable<CompanyProfile> {
    if (this.key === 'demo') {
      return of({ country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '1980-12-12', logo: '', marketCapitalization: 2900000, name: MOCK_QUOTES[symbol]?.name ?? symbol, phone: '', shareOutstanding: 15000, ticker: symbol, weburl: '', finnhubIndustry: 'Technology' });
    }
    const params = new HttpParams().set('symbol', symbol).set('token', this.key);
    return this.http.get<CompanyProfile>(`${this.base}/stock/profile2`, { params }).pipe(
      catchError(() => of({ country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '', logo: '', marketCapitalization: 0, name: symbol, phone: '', shareOutstanding: 0, ticker: symbol, weburl: '', finnhubIndustry: '' }))
    );
  }

  // ─── Chart Data (candles + area) ──────────────────────────────────────────
  getChartData(symbol: string, range: ChartRange): Observable<ChartData> {
    if (this.key === 'demo') {
      return of(this.generateMockChartData(symbol, range));
    }

    const now  = Math.floor(Date.now() / 1000);
    const from = now - RANGE_SECONDS[range];
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('resolution', RESOLUTION[range])
      .set('from', from)
      .set('to', now)
      .set('token', this.key);

    return this.http.get<StockCandle>(`${this.base}/stock/candle`, { params }).pipe(
      map(data => {
        if (data.s !== 'ok' || !data.c?.length) return this.generateMockChartData(symbol, range);
        return this.transformCandleData(data, range, symbol);
      }),
      catchError(() => of(this.generateMockChartData(symbol, range)))
    );
  }

  // ─── Transform Finnhub candles → ChartData ────────────────────────────────
  private transformCandleData(data: StockCandle, range: ChartRange, symbol: string): ChartData {
    const area:    ChartPoint[]  = [];
    const candles: OHLCPoint[]   = [];
    const volume:  { x: string; y: number }[] = [];

    data.t.forEach((ts, i) => {
      const label = this.formatLabel(ts * 1000, range);
      area.push({    x: label, y: +data.c[i].toFixed(2) });
      candles.push({ x: label, y: [+data.o[i].toFixed(2), +data.h[i].toFixed(2), +data.l[i].toFixed(2), +data.c[i].toFixed(2)] });
      volume.push({  x: label, y: data.v?.[i] ?? 0 });
    });

    return { area, candles, volume, range, symbol };
  }

  // ─── Mock OHLC generator — Brownian motion with trend ────────────────────
  private generateMockChartData(symbol: string, range: ChartRange): ChartData {
    const current = MOCK_QUOTES[symbol]?.c ?? 100;
    const startMap = HISTORY_START[symbol];
    const startPrice = startMap ? startMap[range] : current * this.startMultiplier(range);

    const totalPoints = this.pointCount(range);
    const intervalMs  = RANGE_SECONDS[range] * 1000 / totalPoints;
    const vol         = this.volatility(range);
    const startMs     = Date.now() - RANGE_SECONDS[range] * 1000;

    const area:    ChartPoint[]  = [];
    const candles: OHLCPoint[]   = [];
    const volume:  { x: string; y: number }[] = [];

    let price = startPrice;
    const drift = (current - startPrice) / totalPoints; // trend toward current

    for (let i = 0; i < totalPoints; i++) {
      const ts    = startMs + i * intervalMs;
      const label = this.formatLabel(ts, range);

      const noise = (Math.random() - 0.5) * 2 * vol * price;
      const open  = i === 0 ? startPrice : price;
      price = Math.max(1, open + drift + noise);

      const hi  = +(Math.max(open, price) * (1 + Math.random() * 0.008)).toFixed(2);
      const lo  = +(Math.min(open, price) * (1 - Math.random() * 0.008)).toFixed(2);
      const cls = +price.toFixed(2);
      const opn = +open.toFixed(2);
      const vol_  = Math.floor(10e6 + Math.random() * 40e6);

      area.push({    x: label, y: cls });
      candles.push({ x: label, y: [opn, hi, lo, cls] });
      volume.push({  x: label, y: vol_ });
    }

    // Snap last close to current price
    if (area.length)    area[area.length - 1].y       = +current.toFixed(2);
    if (candles.length) candles[candles.length - 1].y[3] = +current.toFixed(2);

    return { area, candles, volume, range, symbol };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private pointCount(r: ChartRange): number {
    return { '1D': 78, '1W': 84, '1M': 30, '3M': 90, '1Y': 52, '5Y': 60 }[r] ?? 30;
  }

  private volatility(r: ChartRange): number {
    return { '1D': 0.003, '1W': 0.006, '1M': 0.012, '3M': 0.015, '1Y': 0.018, '5Y': 0.022 }[r] ?? 0.012;
  }

  private startMultiplier(r: ChartRange): number {
    return { '1D': 0.99, '1W': 0.96, '1M': 0.92, '3M': 0.85, '1Y': 0.72, '5Y': 0.45 }[r] ?? 0.9;
  }

  private formatLabel(ts: number, range: ChartRange): string {
    const d = new Date(ts);
    if (range === '1D') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (range === '1W') {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (range === '5Y') {
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ─── Movers ───────────────────────────────────────────────────────────────
  getTopMovers(): Observable<Mover[]> {
    const movers: Mover[] = Object.values(MOCK_QUOTES).map(q => ({
      symbol: q.symbol, name: q.name ?? q.symbol,
      price: q.c, change: q.d, changePercent: q.dp,
      volume: Math.floor(Math.random() * 50e6)
    }));
    return of(movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)));
  }

  getTickerSymbols(): string[] {
    return ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'NFLX'];
  }
}
