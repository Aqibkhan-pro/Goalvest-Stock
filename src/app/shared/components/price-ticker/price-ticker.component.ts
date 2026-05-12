import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealTimeService, PriceTick } from '../../../core/services/realtime.service';
import { Subscription } from 'rxjs';

interface TickerItem {
  symbol:    string;
  price:     number;
  changePct: number;
  flash:     'up' | 'down' | null;
}

const TICKER_SYMBOLS = ['AAPL','MSFT','TSLA','NVDA','AMZN','GOOGL','META','BTC','ETH','SOL','BNB','DOGE'];

@Component({
  selector: 'app-price-ticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ticker-wrap">
      <div class="ticker-label">
        <span class="pulse-dot" [class.green]="rt.connected()" [class.red]="!rt.connected()"></span>
        {{ rt.mode() === 'live' ? 'LIVE' : 'SIM' }}
      </div>
      <div class="ticker-track">
        <div class="ticker-inner">
          @for (item of displayItems(); track item.symbol + '_a') {
            <div class="ticker-item" [class.flash-up]="item.flash==='up'" [class.flash-dn]="item.flash==='down'">
              <span class="ticker-sym">{{ item.symbol }}</span>
              <span class="ticker-price">\${{ fmt(item.price) }}</span>
              <span class="ticker-chg" [class.up]="item.changePct >= 0" [class.dn]="item.changePct < 0">
                {{ item.changePct >= 0 ? '▲' : '▼' }} {{ fmtPct(item.changePct) }}
              </span>
            </div>
          }
          @for (item of displayItems(); track item.symbol + '_b') {
            <div class="ticker-item" [class.flash-up]="item.flash==='up'" [class.flash-dn]="item.flash==='down'">
              <span class="ticker-sym">{{ item.symbol }}</span>
              <span class="ticker-price">\${{ fmt(item.price) }}</span>
              <span class="ticker-chg" [class.up]="item.changePct >= 0" [class.dn]="item.changePct < 0">
                {{ item.changePct >= 0 ? '▲' : '▼' }} {{ fmtPct(item.changePct) }}
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticker-wrap {
      display: flex;
      align-items: center;
      height: var(--ticker-height);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      overflow: hidden;
    }

    .ticker-label {
      flex-shrink: 0;
      padding: 0 14px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: var(--success);
      border-right: 1px solid var(--border-subtle);
      height: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--success-dim);
      min-width: 64px;
    }

    .ticker-track { flex: 1; overflow: hidden; }

    .ticker-inner {
      display: flex;
      width: max-content;
      animation: ticker-scroll 45s linear infinite;
      &:hover { animation-play-state: paused; }
    }

    .ticker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 18px;
      white-space: nowrap;
      border-right: 1px solid var(--border-subtle);
      transition: background 300ms ease;

      &.flash-up { animation: flash-green 500ms ease; }
      &.flash-dn { animation: flash-red   500ms ease; }
    }

    .ticker-sym   { font-size: 12px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.4px; }
    .ticker-price { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .ticker-chg   {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
      &.up { color: var(--success); }
      &.dn { color: var(--danger); }
    }

    @keyframes flash-green {
      0%   { background: transparent; }
      30%  { background: rgba(16, 185, 129, 0.25); }
      100% { background: transparent; }
    }
    @keyframes flash-red {
      0%   { background: transparent; }
      30%  { background: rgba(239, 68, 68, 0.25); }
      100% { background: transparent; }
    }
  `]
})
export class PriceTickerComponent implements OnInit, OnDestroy {
  readonly rt = inject(RealTimeService);

  items = signal<Map<string, TickerItem>>(new Map(
    TICKER_SYMBOLS.map(s => [s, { symbol: s, price: 0, changePct: 0, flash: null }])
  ));

  displayItems = computed(() => TICKER_SYMBOLS.map(s => this.items().get(s)!).filter(Boolean));

  private sub?: Subscription;
  private flashTimers = new Map<string, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    // Seed with whatever is already in the service
    this.refreshFromService();

    // Subscribe to every tick
    this.sub = this.rt.tickStream$.subscribe(tick => {
      if (!TICKER_SYMBOLS.includes(tick.symbol)) return;
      this.updateItem(tick);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.flashTimers.forEach(t => clearTimeout(t));
  }

  private refreshFromService(): void {
    const map = new Map(this.items());
    TICKER_SYMBOLS.forEach(sym => {
      const tick = this.rt.getTick(sym);
      if (tick) {
        map.set(sym, { symbol: sym, price: tick.price, changePct: tick.changePct, flash: null });
      }
    });
    this.items.set(map);
  }

  private updateItem(tick: PriceTick): void {
    const prev = this.items().get(tick.symbol);
    const direction: 'up' | 'down' | null =
      prev && prev.price > 0
        ? tick.price > prev.price ? 'up' : tick.price < prev.price ? 'down' : null
        : null;

    const map = new Map(this.items());
    map.set(tick.symbol, {
      symbol: tick.symbol, price: tick.price, changePct: tick.changePct, flash: direction
    });
    this.items.set(map);

    // Clear flash after 600ms
    if (direction) {
      const existing = this.flashTimers.get(tick.symbol);
      if (existing) clearTimeout(existing);
      this.flashTimers.set(tick.symbol, setTimeout(() => {
        const m = new Map(this.items());
        const item = m.get(tick.symbol);
        if (item) { m.set(tick.symbol, { ...item, flash: null }); this.items.set(m); }
      }, 600));
    }
  }

  fmt(p: number): string {
    if (!p) return '—';
    if (p < 0.01) return p.toFixed(6);
    if (p < 1)    return p.toFixed(4);
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtPct(p: number): string { return `${Math.abs(p).toFixed(2)}%`; }
}
