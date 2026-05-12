import { Injectable, OnDestroy, signal, inject } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PortfolioService } from './portfolio.service';

export interface PriceTick {
  symbol: string;
  price:  number;
  change: number;
  changePct: number;
  volume?: number;
  timestamp: number;
}

// Seed prices for simulation
const BASE_PRICES: Record<string, number> = {
  AAPL: 189.84, MSFT: 415.32, TSLA: 248.16, NVDA: 875.40,
  AMZN: 182.75, GOOGL: 172.90, META: 492.50, NFLX: 628.40,
  JPM: 198.20,  BAC: 36.80,   BTC: 67420,   ETH: 3542,
  SOL: 178,     BNB: 608,     DOGE: 0.163,  AVAX: 36.4,
  ADA: 0.458,   LINK: 15.20,  DOT: 7.82,    XRP: 0.634,
};

const PREV_CLOSE: Record<string, number> = { ...BASE_PRICES };

@Injectable({ providedIn: 'root' })
export class RealTimeService implements OnDestroy {
  private portfolio = inject(PortfolioService);

  // Public signals
  readonly ticks     = signal<Map<string, PriceTick>>(new Map());
  readonly connected = signal(false);
  readonly mode      = signal<'live' | 'simulated'>('simulated');

  private currentPrices = new Map<string, number>(Object.entries(BASE_PRICES));
  private ws?: WebSocket;
  private simSub?: Subscription;
  private readonly tick$ = new Subject<PriceTick>();

  readonly tickStream$ = this.tick$.asObservable();

  constructor() {
    if (environment.finnhubApiKey && environment.finnhubApiKey !== 'demo') {
      this.connectWebSocket();
    } else {
      this.startSimulation();
    }
  }

  // ─── WebSocket (real Finnhub) ─────────────────────────────────────────────
  private connectWebSocket(): void {
    const url = `wss://ws.finnhub.io?token=${environment.finnhubApiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.mode.set('live');
      const symbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'];
      symbols.forEach(s => this.ws!.send(JSON.stringify({ type: 'subscribe', symbol: s })));
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type !== 'trade' || !msg.data?.length) return;

      const map = new Map(this.ticks());
      msg.data.forEach((trade: { s: string; p: number; v: number; t: number }) => {
        const sym   = trade.s.replace('BINANCE:', '').replace('USDT', '');
        const price = trade.p;
        const prev  = PREV_CLOSE[sym] ?? price;
        const tick: PriceTick = {
          symbol: sym, price,
          change:    +(price - prev).toFixed(4),
          changePct: +((price - prev) / prev * 100).toFixed(2),
          volume:    trade.v,
          timestamp: trade.t,
        };
        map.set(sym, tick);
        this.tick$.next(tick);
      });
      this.ticks.set(map);
      this.syncPortfolio();
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      // Fallback to simulation on disconnect
      setTimeout(() => this.startSimulation(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
      this.startSimulation();
    };
  }

  // ─── Brownian Motion Simulation ───────────────────────────────────────────
  private startSimulation(): void {
    this.connected.set(true);
    this.mode.set('simulated');

    // Emit all symbols immediately
    this.emitSimulatedTicks();

    // Then update every 2 seconds
    this.simSub = interval(2000).subscribe(() => this.emitSimulatedTicks());
  }

  private emitSimulatedTicks(): void {
    const map = new Map(this.ticks());
    const symbols = Object.keys(BASE_PRICES);

    symbols.forEach(sym => {
      const prev  = this.currentPrices.get(sym) ?? BASE_PRICES[sym];
      const base  = BASE_PRICES[sym];

      // Volatility scales with price magnitude (crypto is more volatile)
      const isCrypto = ['BTC','ETH','SOL','BNB','DOGE','AVAX','ADA','LINK','DOT','XRP'].includes(sym);
      const vol = isCrypto ? 0.0015 : 0.0006;

      // Brownian motion with mean reversion toward base price
      const drift     = (base - prev) / base * 0.1;
      const random    = (Math.random() - 0.5) * 2 * vol;
      const newPrice  = prev * (1 + drift + random);
      const rounded   = base > 100 ? +newPrice.toFixed(2) : base > 1 ? +newPrice.toFixed(4) : +newPrice.toFixed(6);

      this.currentPrices.set(sym, rounded);

      const prevClose = PREV_CLOSE[sym] ?? base;
      const tick: PriceTick = {
        symbol:    sym,
        price:     rounded,
        change:    +(rounded - prevClose).toFixed(base > 100 ? 2 : 4),
        changePct: +((rounded - prevClose) / prevClose * 100).toFixed(2),
        timestamp: Date.now(),
      };
      map.set(sym, tick);
      this.tick$.next(tick);
    });

    this.ticks.set(map);
    this.syncPortfolio();
  }

  // ─── Sync portfolio positions with latest prices ──────────────────────────
  private syncPortfolio(): void {
    const prices: Record<string, number> = {};
    this.ticks().forEach((tick, sym) => { prices[sym] = tick.price; });
    this.portfolio.updatePrices(prices);
  }

  getPrice(symbol: string): number {
    return this.ticks().get(symbol)?.price ?? this.currentPrices.get(symbol) ?? BASE_PRICES[symbol] ?? 0;
  }

  getTick(symbol: string): PriceTick | undefined {
    return this.ticks().get(symbol);
  }

  ngOnDestroy(): void {
    this.simSub?.unsubscribe();
    this.ws?.close();
  }
}
