import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { CryptoService }  from '../../core/services/crypto.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentChangePipe }  from '../../shared/pipes/percent-change.pipe';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart/sparkline-chart.component';
import { CryptoMarket }   from '../../core/models/crypto.model';

type CryptoRange = '1D' | '1W' | '1M' | '3M' | '1Y';

const RANGE_DAYS: Record<CryptoRange, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365
};

const CRYPTO_RANGES: CryptoRange[] = ['1D', '1W', '1M', '3M', '1Y'];

@Component({
  selector: 'app-crypto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgApexchartsModule, CurrencyFormatPipe, PercentChangePipe, SparklineChartComponent],
  template: `
    <div class="page-container fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Crypto Markets</h1>
          <p>Top cryptocurrencies by market capitalization</p>
        </div>
        <span class="badge badge-success"><span class="pulse-dot green"></span>Live Prices</span>
      </div>

      <!-- Global Stats -->
      <div class="grid-4" style="margin-bottom:24px">
        <div class="wp-card global-stat">
          <p class="stat-label">Total Market Cap</p>
          <h3 class="mono">{{ (globalData().total_market_cap?.usd ?? 0) | currencyFormat:undefined:true }}</h3>
          <p class="stat-sub" [class.text-success]="(globalData().market_cap_change_percentage_24h_usd ?? 0)>=0"
             [class.text-danger]="(globalData().market_cap_change_percentage_24h_usd ?? 0)<0">
            {{ (globalData().market_cap_change_percentage_24h_usd ?? 0) | percentChange }} (24h)
          </p>
        </div>
        <div class="wp-card global-stat">
          <p class="stat-label">24h Volume</p>
          <h3 class="mono">{{ (globalData().total_volume?.usd ?? 0) | currencyFormat:undefined:true }}</h3>
          <p class="stat-sub text-muted">Trading volume</p>
        </div>
        <div class="wp-card global-stat">
          <p class="stat-label">BTC Dominance</p>
          <h3 class="mono">{{ (globalData().market_cap_percentage?.btc ?? 0).toFixed(1) }}%</h3>
          <div class="dom-bar"><div class="dom-fill btc" [style.width]="(globalData().market_cap_percentage?.btc ?? 0) + '%'"></div></div>
        </div>
        <div class="wp-card global-stat">
          <p class="stat-label">Fear &amp; Greed Index</p>
          <div class="fear-greed" [attr.data-level]="fearGreedLevel()">
            <h3 class="mono">{{ fearGreedValue() }}</h3>
            <span>{{ fearGreedLabel() }}</span>
          </div>
        </div>
      </div>

      <!-- Crypto Table -->
      <div class="wp-card" style="padding:0;overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h3 style="font-size:15px;font-weight:600;flex:1">Top 20 Cryptocurrencies</h3>
          <div style="position:relative">
            <span class="material-icons" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted)">search</span>
            <input class="wp-input" style="padding-left:36px;width:200px" placeholder="Search…" [(ngModel)]="searchQuery">
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="wp-table">
            <thead><tr>
              <th style="width:40px">#</th>
              <th>Name</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Market Cap</th>
              <th>Volume 24h</th>
              <th>Circulating Supply</th>
              <th>7D Chart</th>
            </tr></thead>
            <tbody>
              @if (loading()) {
                @for (i of [1,2,3,4,5,6,7,8,9,10]; track i) {
                  <tr><td colspan="8"><div class="skeleton skeleton-text" style="margin:8px 14px;width:90%"></div></td></tr>
                }
              }
              @for (coin of filteredCoins(); track coin.id) {
                <tr (click)="selectCoin(coin)" style="cursor:pointer" [class.selected-row]="selectedCoin()?.id === coin.id">
                  <td style="color:var(--text-muted);font-size:12px">{{ coin.market_cap_rank }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <img [src]="coin.image" [alt]="coin.name" style="width:28px;height:28px;border-radius:50%" loading="lazy">
                      <div>
                        <div style="font-weight:700;font-size:13px">{{ coin.name }}</div>
                        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">{{ coin.symbol }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono fw-600">{{ coin.current_price | currencyFormat }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="coin.price_change_percentage_24h>=0" [class.badge-danger]="coin.price_change_percentage_24h<0">
                      {{ coin.price_change_percentage_24h | percentChange }}
                    </span>
                  </td>
                  <td class="mono" style="color:var(--text-secondary)">{{ coin.market_cap | currencyFormat:undefined:true }}</td>
                  <td class="mono" style="color:var(--text-secondary)">{{ coin.total_volume | currencyFormat:undefined:true }}</td>
                  <td>
                    <div style="font-size:12px;color:var(--text-muted)">
                      {{ formatSupply(coin.circulating_supply) }} {{ coin.symbol.toUpperCase() }}
                    </div>
                  </td>
                  <td>
                    <app-sparkline
                      [data]="getCoinSpark(coin)"
                      [positive]="coin.price_change_percentage_24h >= 0"
                      [width]="80" [height]="32">
                    </app-sparkline>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail Panel -->
      @if (selectedCoin()) {
        <div class="coin-detail-panel fade-in-up">
          <div class="wp-card" style="padding:24px">

            <!-- Top row -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:14px">
                <img [src]="selectedCoin()!.image" [alt]="selectedCoin()!.name" style="width:52px;height:52px;border-radius:50%">
                <div>
                  <h2 style="font-size:22px;font-weight:700">{{ selectedCoin()!.name }}</h2>
                  <span style="font-size:13px;color:var(--text-muted);text-transform:uppercase">{{ selectedCoin()!.symbol }}</span>
                </div>
              </div>
              <div style="text-align:right">
                <h3 class="mono" style="font-size:28px;font-weight:700">{{ selectedCoin()!.current_price | currencyFormat }}</h3>
                <span class="badge" [class.badge-success]="selectedCoin()!.price_change_percentage_24h>=0" [class.badge-danger]="selectedCoin()!.price_change_percentage_24h<0">
                  {{ selectedCoin()!.price_change_percentage_24h | percentChange }} (24h)
                </span>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid-4" style="margin-bottom:20px">
              <div class="detail-stat"><p>24h High</p><h4 class="mono text-success">{{ selectedCoin()!.high_24h | currencyFormat }}</h4></div>
              <div class="detail-stat"><p>24h Low</p><h4 class="mono text-danger">{{ selectedCoin()!.low_24h | currencyFormat }}</h4></div>
              <div class="detail-stat"><p>Market Cap</p><h4 class="mono">{{ selectedCoin()!.market_cap | currencyFormat:undefined:true }}</h4></div>
              <div class="detail-stat"><p>ATH</p><h4 class="mono">{{ selectedCoin()!.ath | currencyFormat }}</h4></div>
            </div>

            <!-- Range selector -->
            <div class="range-tabs" style="margin-bottom:16px">
              @for (r of cryptoRanges; track r) {
                <button class="range-btn" [class.active]="selectedRange() === r" (click)="setRange(r)">{{ r }}</button>
              }
            </div>

            <!-- Chart loading -->
            @if (chartLoading()) {
              <div class="skeleton" style="height:260px;border-radius:8px"></div>
            } @else {
              <apx-chart
                [series]="coinChartSeries()"
                [chart]="coinChart"
                [xaxis]="coinXaxis()"
                [yaxis]="coinYaxis"
                [stroke]="coinStroke"
                [fill]="coinFill"
                [dataLabels]="noLabels"
                [tooltip]="coinTooltip"
                [grid]="coinGrid"
                [colors]="[selectedCoin()!.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444']">
              </apx-chart>
            }

            <div style="margin-top:16px;text-align:right">
              <button class="btn-ghost" style="font-size:12px" (click)="selectedCoin.set(null)">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .global-stat {
      .stat-label { font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;font-weight:600; }
      h3 { font-size:20px;font-weight:700;margin-bottom:4px; }
      .stat-sub { font-size:12px;font-weight:500; }
    }

    .dom-bar {
      height: 6px; background: var(--bg-surface); border-radius: 3px; margin-top: 8px; overflow: hidden;
    }
    .dom-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
    .btc { background: var(--gold); }

    .fear-greed {
      display: flex; align-items: baseline; gap: 8px;
      h3 { font-size: 28px; font-weight: 800; }
      span { font-size: 13px; font-weight: 500; }

      &[data-level="extreme-fear"] { h3, span { color: var(--danger); } }
      &[data-level="fear"]         { h3, span { color: #F97316; } }
      &[data-level="neutral"]      { h3, span { color: var(--gold); } }
      &[data-level="greed"]        { h3, span { color: var(--success); } }
      &[data-level="extreme-greed"] { h3, span { color: var(--primary); } }
    }

    .selected-row td { background: var(--primary-dim) !important; }

    .coin-detail-panel { margin-top: 24px; animation: fade-in-up 0.3s ease; }

    .detail-stat {
      background: var(--bg-surface); border-radius: var(--radius-md); padding: 14px 16px;
      p { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
      h4 { font-size: 16px; font-weight: 700; }
    }

    .range-tabs {
      display: flex;
      gap: 4px;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      padding: 4px;
      width: fit-content;
    }

    .range-btn {
      padding: 5px 14px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      font-family: 'Inter', sans-serif;

      &:hover { color: var(--text-primary); background: var(--bg-card); }
      &.active { background: var(--primary); color: #fff; }
    }
  `]
})
export class CryptoComponent implements OnInit, OnDestroy {
  private cryptoService = inject(CryptoService);

  coins         = signal<CryptoMarket[]>([]);
  loading       = signal(true);
  globalData    = signal<any>({ total_market_cap: { usd: 2460000000000 }, total_volume: { usd: 98000000000 }, market_cap_percentage: { btc: 53.9, eth: 17.3 }, market_cap_change_percentage_24h_usd: 1.2 });
  selectedCoin  = signal<CryptoMarket | null>(null);
  searchQuery   = '';
  fearGreedValue = signal(72);

  selectedRange  = signal<CryptoRange>('1D');
  chartLoading   = signal(false);
  cryptoRanges   = CRYPTO_RANGES;

  private sub?: Subscription;
  private chartSub?: Subscription;

  noLabels: any   = { enabled: false };
  coinChart: any  = { type: 'area', height: 260, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif', foreColor: 'var(--text-secondary)', animations: { enabled: true, speed: 400 }, zoom: { enabled: false } };
  coinYaxis: any  = { labels: { style: { colors: '#6B7280', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }, formatter: (v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v.toFixed(2)}` } };
  coinStroke: any = { curve: 'smooth', width: 2 };
  coinFill: any   = { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', opacityFrom: 0.3, opacityTo: 0 } };
  coinGrid: any   = { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4, xaxis: { lines: { show: false } } };
  coinTooltip: any = { theme: 'dark', x: { show: true }, y: { formatter: (v: number) => v >= 1000 ? `$${v.toLocaleString('en-US', {minimumFractionDigits:2})}` : `$${v.toFixed(4)}` } };

  coinChartSeries = signal<any[]>([]);

  coinXaxis = computed(() => {
    const series = this.coinChartSeries();
    const labels: string[] = series[0]?.data?.map((p: any) => p.x) ?? [];
    const maxTicks = 8;
    const step = Math.max(1, Math.floor(labels.length / maxTicks));
    return {
      type: 'category' as const,
      categories: labels,
      tickAmount: maxTicks,
      labels: {
        rotate: 0,
        style: { colors: '#6B7280', fontFamily: 'Inter', fontSize: '11px' },
        formatter: (_: string, i: number) => (i % step === 0 ? labels[i] : ''),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    };
  });

  fearGreedLevel = () => {
    const v = this.fearGreedValue();
    if (v <= 25) return 'extreme-fear';
    if (v <= 45) return 'fear';
    if (v <= 55) return 'neutral';
    if (v <= 75) return 'greed';
    return 'extreme-greed';
  };

  fearGreedLabel = () => {
    const v = this.fearGreedValue();
    if (v <= 25) return 'Extreme Fear';
    if (v <= 45) return 'Fear';
    if (v <= 55) return 'Neutral';
    if (v <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  filteredCoins = () => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.coins();
    return this.coins().filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  };

  ngOnInit(): void {
    this.sub = interval(60000).pipe(
      startWith(0),
      switchMap(() => this.cryptoService.getTopCoins(20))
    ).subscribe(coins => {
      this.coins.set(coins);
      this.loading.set(false);
    });

    this.cryptoService.getGlobalData().subscribe(g => this.globalData.set(g.data));
    this.fearGreedValue.set(65 + Math.floor(Math.random() * 20));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chartSub?.unsubscribe();
  }

  getCoinSpark(coin: CryptoMarket): number[] {
    const base = coin.current_price;
    const dir  = coin.price_change_percentage_24h > 0 ? 1 : -1;
    return Array.from({ length: 20 }, (_, i) => base * (1 - dir * 0.05 + i * dir * 0.005 + (Math.random() - 0.5) * 0.02));
  }

  formatSupply(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toLocaleString();
  }

  selectCoin(coin: CryptoMarket): void {
    this.selectedCoin.set(coin);
    this.selectedRange.set('1D');
    this.loadChart(coin.id, '1D');
  }

  setRange(range: CryptoRange): void {
    const coin = this.selectedCoin();
    if (!coin) return;
    this.selectedRange.set(range);
    this.loadChart(coin.id, range);
  }

  private loadChart(id: string, range: CryptoRange): void {
    this.chartLoading.set(true);
    this.chartSub?.unsubscribe();
    const days = RANGE_DAYS[range];
    this.chartSub = this.cryptoService.getPriceHistory(id, days).subscribe(history => {
      const prices = history.prices ?? [];
      const coin = this.selectedCoin();
      const data = prices.map(([ts, price]) => ({
        x: this.formatLabel(ts, range),
        y: +price.toFixed(coin && coin.current_price < 1 ? 4 : 2),
      }));
      this.coinChartSeries.set([{ name: coin?.name ?? id, data }]);
      this.chartLoading.set(false);
    });
  }

  private formatLabel(ts: number, range: CryptoRange): string {
    const d = new Date(ts);
    if (range === '1D') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (range === '1W') {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    if (range === '1Y') {
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
