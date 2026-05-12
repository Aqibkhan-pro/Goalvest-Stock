import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { StockService, ChartRange, ChartData } from '../../core/services/stock.service';
import { ForexService, ForexRate }    from '../../core/services/forex.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentChangePipe }  from '../../shared/pipes/percent-change.pipe';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart/sparkline-chart.component';
import { StockQuote, MarketIndex } from '../../core/models/stock.model';

type MarketTab = 'stocks' | 'crypto' | 'forex' | 'commodities';
type ChartView = 'area' | 'candlestick';

const MARKET_INDICES: MarketIndex[] = [
  { symbol: 'SPX',    name: 'S&P 500',    value: 5234.18, change: 28.42,  changePercent: 0.55,  region: 'US' },
  { symbol: 'NDX',    name: 'NASDAQ 100', value: 18340.65, change: 102.3, changePercent: 0.56,  region: 'US' },
  { symbol: 'DJI',    name: 'DOW JONES',  value: 39807.37, change: 130.8, changePercent: 0.33,  region: 'US' },
  { symbol: 'NIFTY',  name: 'NIFTY 50',   value: 22147.90, change: -85.4, changePercent: -0.38, region: 'IN' },
];

const COMMODITIES = [
  { symbol: 'GOLD',   name: 'Gold',         price: 2326.40, change: 12.80,   changePercent: 0.55,  unit: '/oz' },
  { symbol: 'SILVER', name: 'Silver',       price: 27.84,   change: -0.22,   changePercent: -0.78, unit: '/oz' },
  { symbol: 'OIL',    name: 'Crude Oil',    price: 83.42,   change: 1.15,    changePercent: 1.40,  unit: '/bbl' },
  { symbol: 'NATGAS', name: 'Natural Gas',  price: 2.12,    change: -0.04,   changePercent: -1.85, unit: '/MMBtu' },
  { symbol: 'COPPER', name: 'Copper',       price: 4.56,    change: 0.08,    changePercent: 1.79,  unit: '/lb' },
  { symbol: 'WHEAT',  name: 'Wheat',        price: 558.50,  change: -4.25,   changePercent: -0.75, unit: '/bu' },
];

const RANGES: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

@Component({
  selector: 'app-markets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, NgApexchartsModule, CurrencyFormatPipe, PercentChangePipe, SparklineChartComponent],
  template: `
    <div class="page-container fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Markets</h1>
          <p>Live market data across stocks, crypto, forex, and commodities</p>
        </div>
        <div style="display:flex;gap:8px">
          <span class="badge badge-success"><span class="pulse-dot green"></span>Live Data</span>
        </div>
      </div>

      <!-- Market Indices -->
      <div class="grid-4" style="margin-bottom:24px">
        @for (idx of indices; track idx.symbol) {
          <div class="wp-card index-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <p style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px">{{ idx.name }}</p>
                <h2 class="mono" style="font-size:22px;font-weight:700">{{ idx.value.toLocaleString('en-US', {minimumFractionDigits:2}) }}</h2>
              </div>
              <span class="badge" style="margin-top:4px"
                    [class.badge-success]="idx.changePercent >= 0"
                    [class.badge-danger]="idx.changePercent < 0">
                {{ idx.changePercent >= 0 ? '▲' : '▼' }} {{ idx.changePercent | percentChange:false }}
              </span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
              <span style="font-size:12px" [class.text-success]="idx.changePercent>=0" [class.text-danger]="idx.changePercent<0" class="mono">
                {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}
              </span>
              <span style="font-size:11px;color:var(--text-muted)">{{ idx.region }}</span>
            </div>
            <div style="margin-top:12px">
              <app-sparkline [data]="getIdxSpark(idx.changePercent)" [positive]="idx.changePercent>=0" [width]="200" [height]="36"></app-sparkline>
            </div>
          </div>
        }
      </div>

      <!-- Tabs -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div class="wp-tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'stocks'"      (click)="activeTab.set('stocks')">Stocks</button>
          <button class="tab-btn" [class.active]="activeTab() === 'crypto'"      (click)="activeTab.set('crypto')">Crypto</button>
          <button class="tab-btn" [class.active]="activeTab() === 'forex'"       (click)="activeTab.set('forex')">Forex</button>
          <button class="tab-btn" [class.active]="activeTab() === 'commodities'" (click)="activeTab.set('commodities')">Commodities</button>
        </div>
        <div style="position:relative">
          <span class="material-icons" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted)">search</span>
          <input class="wp-input" style="padding-left:36px;width:220px" placeholder="Search…" [(ngModel)]="searchQuery">
        </div>
      </div>

      <!-- Watchlist + Table -->
      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px" class="market-grid">

        <!-- Main Table -->
        <div class="wp-card" style="padding:0;overflow:hidden">
          @if (activeTab() === 'stocks') {
            <table class="wp-table">
              <thead><tr>
                <th>Symbol</th><th>Price</th><th>Change</th><th>Change %</th><th>High</th><th>Low</th><th>Chart</th>
              </tr></thead>
              <tbody>
                @if (stocksLoading()) {
                  @for (i of [1,2,3,4,5,6,7,8]; track i) {
                    <tr><td colspan="7"><div class="skeleton skeleton-text" style="margin:6px 14px;width:80%"></div></td></tr>
                  }
                }
                @for (q of filteredStocks(); track q.symbol) {
                  <tr style="cursor:pointer" [class.selected-row]="selectedStock()?.symbol === q.symbol" (click)="selectStock(q)">
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="sym-dot"></div>
                        <div>
                          <div style="font-weight:700;font-size:13px">{{ q.symbol }}</div>
                          <div style="font-size:11px;color:var(--text-muted)">{{ q.name ?? q.symbol }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="mono fw-600">{{ q.c | currencyFormat }}</td>
                    <td class="mono" [class.text-success]="q.d>=0" [class.text-danger]="q.d<0">{{ q.d>=0?'+':'' }}{{ q.d.toFixed(2) }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="q.dp>=0" [class.badge-danger]="q.dp<0">
                        {{ q.dp | percentChange }}
                      </span>
                    </td>
                    <td class="mono" style="color:var(--text-secondary)">{{ q.h | currencyFormat }}</td>
                    <td class="mono" style="color:var(--text-secondary)">{{ q.l | currencyFormat }}</td>
                    <td><app-sparkline [data]="getSparkData(q.dp)" [positive]="q.dp>=0" [width]="70" [height]="30"></app-sparkline></td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (activeTab() === 'forex') {
            <table class="wp-table">
              <thead><tr><th>Pair</th><th>Rate</th><th>Change</th><th>Change %</th></tr></thead>
              <tbody>
                @for (r of filteredForex(); track r.pair) {
                  <tr>
                    <td><span style="font-weight:700;font-size:13px">{{ r.pair }}</span></td>
                    <td class="mono fw-600">{{ r.rate.toFixed(4) }}</td>
                    <td class="mono" [class.text-success]="r.change>=0" [class.text-danger]="r.change<0">{{ r.change>=0?'+':'' }}{{ r.change.toFixed(4) }}</td>
                    <td><span class="badge" [class.badge-success]="r.changePercent>=0" [class.badge-danger]="r.changePercent<0">{{ r.changePercent | percentChange }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (activeTab() === 'commodities') {
            <table class="wp-table">
              <thead><tr><th>Name</th><th>Price</th><th>Change</th><th>Change %</th><th>Chart</th></tr></thead>
              <tbody>
                @for (c of commodities; track c.symbol) {
                  <tr>
                    <td>
                      <div style="font-weight:700;font-size:13px">{{ c.name }}</div>
                      <div style="font-size:11px;color:var(--text-muted)">{{ c.unit }}</div>
                    </td>
                    <td class="mono fw-600">\${{ c.price.toLocaleString('en-US', {minimumFractionDigits:2}) }}</td>
                    <td class="mono" [class.text-success]="c.change>=0" [class.text-danger]="c.change<0">{{ c.change>=0?'+':'' }}{{ c.change.toFixed(2) }}</td>
                    <td><span class="badge" [class.badge-success]="c.changePercent>=0" [class.badge-danger]="c.changePercent<0">{{ c.changePercent | percentChange }}</span></td>
                    <td><app-sparkline [data]="getSparkData(c.changePercent)" [positive]="c.changePercent>=0" [width]="70" [height]="30"></app-sparkline></td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (activeTab() === 'crypto') {
            <div style="padding:40px;text-align:center;color:var(--text-muted)">
              <span class="material-icons" style="font-size:40px;opacity:0.3">currency_bitcoin</span>
              <p style="margin-top:12px">View full crypto data on the <a routerLink="/app/crypto" style="color:var(--primary)">Crypto page →</a></p>
            </div>
          }
        </div>

        <!-- Watchlist -->
        <div class="wp-card" style="padding:0;overflow:hidden">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-size:14px;font-weight:600">Watchlist</h3>
            <button class="btn-ghost" style="padding:5px 10px;font-size:12px" (click)="addToWatchlist()">+ Add</button>
          </div>
          @for (w of watchlist(); track w.symbol) {
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div>
                <div style="font-weight:700;font-size:13px">{{ w.symbol }}</div>
                <div class="mono" style="font-size:12px;color:var(--text-muted)">{{ w.c | currencyFormat }}</div>
              </div>
              <div style="text-align:right">
                <span class="badge" style="display:inline-flex" [class.badge-success]="w.dp>=0" [class.badge-danger]="w.dp<0">
                  {{ w.dp | percentChange }}
                </span>
              </div>
            </div>
          }
        </div>

      </div>

      <!-- Stock Detail Panel -->
      @if (selectedStock()) {
        <div class="detail-panel fade-in-up" style="margin-top:24px">
          <div class="wp-card" style="padding:24px">

            <!-- Header row -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
              <div>
                <div style="display:flex;align-items:center;gap:12px">
                  <h2 style="font-size:24px;font-weight:700">{{ selectedStock()!.symbol }}</h2>
                  <span class="badge badge-primary">{{ selectedStock()!.name }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:16px;margin-top:8px">
                  <span class="mono" style="font-size:28px;font-weight:700">{{ selectedStock()!.c | currencyFormat }}</span>
                  <span class="mono" style="font-size:16px" [class.text-success]="selectedStock()!.dp>=0" [class.text-danger]="selectedStock()!.dp<0">
                    {{ selectedStock()!.dp>=0?'+':'' }}{{ selectedStock()!.d.toFixed(2) }} ({{ selectedStock()!.dp | percentChange }})
                  </span>
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <!-- Chart view toggle -->
                <div class="view-toggle">
                  <button [class.active]="chartView() === 'area'" (click)="chartView.set('area')" title="Area chart">
                    <span class="material-icons" style="font-size:16px">show_chart</span>
                  </button>
                  <button [class.active]="chartView() === 'candlestick'" (click)="chartView.set('candlestick')" title="Candlestick">
                    <span class="material-icons" style="font-size:16px">candlestick_chart</span>
                  </button>
                </div>
                <button class="btn-primary" style="font-size:12px;padding:7px 14px">Buy</button>
                <button class="btn-ghost"   style="font-size:12px;padding:7px 14px" (click)="selectedStock.set(null)">Close</button>
              </div>
            </div>

            <!-- Stats row -->
            <div class="grid-4" style="margin-bottom:20px">
              <div class="detail-stat"><p>Open</p><h4 class="mono">{{ selectedStock()!.o | currencyFormat }}</h4></div>
              <div class="detail-stat"><p>High</p><h4 class="mono text-success">{{ selectedStock()!.h | currencyFormat }}</h4></div>
              <div class="detail-stat"><p>Low</p><h4 class="mono text-danger">{{ selectedStock()!.l | currencyFormat }}</h4></div>
              <div class="detail-stat"><p>Prev Close</p><h4 class="mono">{{ selectedStock()!.pc | currencyFormat }}</h4></div>
            </div>

            <!-- Range selector -->
            <div class="range-tabs" style="margin-bottom:16px">
              @for (r of ranges; track r) {
                <button class="range-btn" [class.active]="selectedRange() === r" (click)="setRange(r)">{{ r }}</button>
              }
            </div>

            <!-- Chart loading skeleton -->
            @if (chartLoading()) {
              <div class="chart-skeleton">
                <div class="skeleton" style="height:260px;border-radius:8px"></div>
              </div>
            } @else {
              <!-- Area chart -->
              @if (chartView() === 'area') {
                <apx-chart
                  [series]="areaChartSeries()"
                  [chart]="areaChartConfig"
                  [xaxis]="areaXaxis()"
                  [yaxis]="detailYaxis"
                  [stroke]="detailStroke"
                  [fill]="detailFill"
                  [dataLabels]="noDataLabels"
                  [tooltip]="detailTooltip"
                  [grid]="detailGrid"
                  [colors]="[selectedStock()!.dp >= 0 ? '#10B981' : '#EF4444']">
                </apx-chart>
              }
              <!-- Candlestick chart -->
              @if (chartView() === 'candlestick') {
                <apx-chart
                  [series]="candleChartSeries()"
                  [chart]="candleChartConfig"
                  [xaxis]="areaXaxis()"
                  [yaxis]="detailYaxis"
                  [dataLabels]="noDataLabels"
                  [tooltip]="candleTooltip"
                  [grid]="detailGrid"
                  [plotOptions]="candlePlotOptions">
                </apx-chart>
              }
            }

            <!-- Volume bar -->
            @if (!chartLoading() && volumeSeries().length) {
              <div style="margin-top:4px">
                <apx-chart
                  [series]="volumeSeries()"
                  [chart]="volumeChartConfig"
                  [xaxis]="areaXaxis()"
                  [yaxis]="volumeYaxis"
                  [dataLabels]="noDataLabels"
                  [tooltip]="volumeTooltip"
                  [grid]="detailGrid"
                  [colors]="['rgba(99,102,241,0.4)']"
                  [plotOptions]="{ bar: { columnWidth: '80%' } }">
                </apx-chart>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .market-grid { @media (max-width: 1000px) { grid-template-columns: 1fr !important; } }

    .index-card { padding: 18px; transition: all var(--transition); &:hover { transform: translateY(-2px); } }

    .sym-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--primary);
      flex-shrink: 0;
    }

    .selected-row td { background: var(--primary-dim) !important; }

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

    .view-toggle {
      display: flex;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;

      button {
        padding: 6px 10px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all var(--transition);

        &:hover { color: var(--text-primary); background: var(--bg-card); }
        &.active { background: var(--primary-dim); color: var(--primary); }
      }
    }

    .detail-stat {
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      padding: 12px 16px;

      p  { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
      h4 { font-size: 16px; font-weight: 700; }
    }

    .chart-skeleton { padding: 0 0 12px; }
  `]
})
export class MarketsComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private forexService = inject(ForexService);

  activeTab     = signal<MarketTab>('stocks');
  searchQuery   = '';
  stocks        = signal<StockQuote[]>([]);
  stocksLoading = signal(true);
  forexRates    = signal<ForexRate[]>([]);
  selectedStock = signal<StockQuote | null>(null);
  indices       = MARKET_INDICES;
  commodities   = COMMODITIES;
  ranges        = RANGES;

  watchlist     = signal<StockQuote[]>([]);
  selectedRange = signal<ChartRange>('1D');
  chartView     = signal<ChartView>('area');
  chartLoading  = signal(false);
  chartData     = signal<ChartData | null>(null);

  private sub?: Subscription;
  private chartSub?: Subscription;

  noDataLabels: any = { enabled: false };

  areaChartConfig: any = {
    type: 'area', height: 260,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
    foreColor: 'var(--text-secondary)',
    animations: { enabled: true, speed: 400 },
    zoom: { enabled: false },
  };

  candleChartConfig: any = {
    type: 'candlestick', height: 260,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
    foreColor: 'var(--text-secondary)',
    animations: { enabled: true, speed: 400 },
    zoom: { enabled: false },
  };

  volumeChartConfig: any = {
    type: 'bar', height: 60,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
    sparkline: { enabled: false },
    zoom: { enabled: false },
  };

  detailYaxis: any  = { labels: { style: { colors: '#6B7280', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }, formatter: (v: number) => `$${v.toFixed(0)}` } };
  volumeYaxis: any  = { labels: { show: false } };
  detailStroke: any = { curve: 'smooth', width: 2 };
  detailFill: any   = { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] } };
  detailGrid: any   = { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4, xaxis: { lines: { show: false } } };
  detailTooltip: any = { theme: 'dark', y: { formatter: (v: number) => `$${v.toFixed(2)}` } };
  candleTooltip: any = { theme: 'dark' };
  volumeTooltip: any = { theme: 'dark', y: { formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } };
  candlePlotOptions: any = { candlestick: { colors: { upward: '#10B981', downward: '#EF4444' }, wick: { useFillColor: true } } };

  areaXaxis = computed(() => {
    const data = this.chartData();
    const labels = data?.area.map(p => p.x) ?? [];
    const maxTicks = 8;
    const step = Math.max(1, Math.floor(labels.length / maxTicks));
    return {
      type: 'category' as const,
      categories: labels,
      tickAmount: maxTicks,
      labels: { rotate: 0, style: { colors: '#6B7280', fontFamily: 'Inter', fontSize: '11px' }, formatter: (_: string, i: number) => (i % step === 0 ? labels[i] : '') },
      axisBorder: { show: false },
      axisTicks: { show: false },
    };
  });

  areaChartSeries = computed(() => {
    const data = this.chartData();
    if (!data?.area.length) return [];
    return [{ name: this.selectedStock()?.symbol ?? '', data: data.area.map(p => p.y) }];
  });

  candleChartSeries = computed(() => {
    const data = this.chartData();
    if (!data?.candles.length) return [];
    return [{ name: this.selectedStock()?.symbol ?? '', data: data.candles.map(p => ({ x: p.x, y: p.y })) }];
  });

  volumeSeries = computed(() => {
    const data = this.chartData();
    if (!data?.volume.length) return [];
    return [{ name: 'Volume', data: data.volume.map(p => p.y) }];
  });

  filteredStocks = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.stocks();
    return this.stocks().filter(s => s.symbol.toLowerCase().includes(q) || (s.name ?? '').toLowerCase().includes(q));
  });

  filteredForex = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.forexRates();
    return this.forexRates().filter(r => r.pair.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.sub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.stockService.getMultipleQuotes(['AAPL','MSFT','TSLA','NVDA','AMZN','GOOGL','META','NFLX','JPM','BAC','WMT','DIS','PYPL','INTC']))
    ).subscribe(quotes => {
      this.stocks.set(quotes);
      this.stocksLoading.set(false);
      this.watchlist.set(quotes.slice(0, 5));
    });

    this.forexService.getForexRates().subscribe(r => this.forexRates.set(r));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chartSub?.unsubscribe();
  }

  selectStock(q: StockQuote): void {
    this.selectedStock.set(q);
    this.selectedRange.set('1D');
    this.loadChart(q.symbol, '1D');
  }

  setRange(range: ChartRange): void {
    const sym = this.selectedStock()?.symbol;
    if (!sym) return;
    this.selectedRange.set(range);
    this.loadChart(sym, range);
  }

  private loadChart(symbol: string, range: ChartRange): void {
    this.chartLoading.set(true);
    this.chartSub?.unsubscribe();
    this.chartSub = this.stockService.getChartData(symbol, range).subscribe(data => {
      this.chartData.set(data);
      this.chartLoading.set(false);
    });
  }

  getSparkData(pct: number): number[] {
    return Array.from({ length: 20 }, (_, i) => 100 + i * (pct > 0 ? 0.5 : -0.5) + (Math.random() - 0.5) * 3);
  }

  getIdxSpark(pct: number): number[] {
    return Array.from({ length: 25 }, (_, i) => 1000 + i * (pct > 0 ? 2 : -2) + (Math.random() - 0.5) * 10);
  }

  addToWatchlist(): void {}
}
