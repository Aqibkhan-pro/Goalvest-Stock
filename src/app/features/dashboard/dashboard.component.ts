import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexStroke,
         ApexFill, ApexTooltip, ApexLegend, ApexNonAxisChartSeries,
         ApexPlotOptions, ApexResponsive } from 'ng-apexcharts';
import { interval, Subscription } from 'rxjs';

import { PortfolioService }  from '../../core/services/portfolio.service';
import { StockService }      from '../../core/services/stock.service';
import { RealTimeService }   from '../../core/services/realtime.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart/sparkline-chart.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentChangePipe }  from '../../shared/pipes/percent-change.pipe';
import { Mover } from '../../core/models/stock.model';

type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, NgApexchartsModule,
    StatCardComponent, SparklineChartComponent,
    CurrencyFormatPipe, PercentChangePipe
  ],
  template: `
    <div class="page-container fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Dashboard</h1>
          <p>Welcome back, Alex — here's your portfolio overview</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge badge-success">
            <span class="pulse-dot green"></span>
            Markets Open
          </span>
          <span class="text-muted" style="font-size:12px">{{ now() }}</span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4" style="margin-bottom:24px">
        <app-stat-card
          label="Total Portfolio Value"
          [value]="portfolio.summary().totalValue"
          [change]="portfolio.summary().todayGainLossPercent"
          icon="account_balance_wallet"
          iconBg="linear-gradient(135deg,#3B82F6,#7C3AED)"
          [isCurrency]="true">
        </app-stat-card>
        <app-stat-card
          label="Today's Gain / Loss"
          [value]="portfolio.summary().todayGainLoss"
          icon="trending_up"
          [iconBg]="portfolio.summary().todayGainLoss >= 0 ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#EF4444,#DC2626)'"
          [isCurrency]="true">
        </app-stat-card>
        <app-stat-card
          label="Total Return"
          [value]="portfolio.summary().totalGainLossPercent"
          subtitle="All-time performance"
          icon="show_chart"
          iconBg="linear-gradient(135deg,#F59E0B,#D97706)"
          [isPercent]="true">
        </app-stat-card>
        <app-stat-card
          label="Cash Balance"
          [value]="portfolio.summary().cashBalance"
          subtitle="Available to invest"
          icon="payments"
          iconBg="linear-gradient(135deg,#10B981,#065F46)"
          [isCurrency]="true">
        </app-stat-card>
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;margin-bottom:24px"
           class="charts-row">

        <!-- Performance Chart -->
        <div class="wp-card" style="padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
            <div>
              <h3 style="font-size:15px">Portfolio Performance</h3>
              <p class="text-muted" style="font-size:12px;margin-top:2px">
                {{ portfolio.summary().totalValue | currencyFormat }} total value
              </p>
            </div>
            <div class="wp-tabs">
              @for (r of chartRanges; track r) {
                <button class="tab-btn" [class.active]="activeRange() === r" (click)="setRange(r)">{{ r }}</button>
              }
            </div>
          </div>
          <apx-chart
            [series]="perfSeries()"
            [chart]="perfChart"
            [xaxis]="perfXaxis()"
            [yaxis]="perfYaxis"
            [stroke]="perfStroke"
            [fill]="perfFill"
            [dataLabels]="noDataLabels"
            [tooltip]="perfTooltip"
            [grid]="perfGrid"
            [colors]="['#3B82F6']">
          </apx-chart>
        </div>

        <!-- Allocation Donut -->
        <div class="wp-card" style="padding:20px">
          <h3 style="font-size:15px;margin-bottom:6px">Asset Allocation</h3>
          <p class="text-muted" style="font-size:12px;margin-bottom:20px">Portfolio distribution</p>
          <apx-chart
            [series]="donutSeries()"
            [chart]="donutChart"
            [labels]="donutLabels()"
            [colors]="donutColors()"
            [dataLabels]="donutDataLabels"
            [plotOptions]="donutPlotOptions"
            [legend]="donutLegend"
            [tooltip]="donutTooltip">
          </apx-chart>
          <!-- Allocation legend -->
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
            @for (item of portfolio.allocation(); track item.label) {
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:10px;height:10px;border-radius:50%" [style.background]="item.color"></div>
                  <span style="font-size:13px;color:var(--text-secondary)">{{ item.label }}</span>
                </div>
                <div style="text-align:right">
                  <span class="mono" style="font-size:13px;font-weight:600">{{ item.percentage.toFixed(1) }}%</span>
                  <span style="font-size:11px;color:var(--text-muted);margin-left:6px">{{ item.value | currencyFormat }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="bottom-row">

        <!-- Top Movers -->
        <div class="wp-card" style="padding:0;overflow:hidden">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-size:15px">Top Movers</h3>
            <a routerLink="/app/markets" style="font-size:12px;color:var(--primary);text-decoration:none">View All →</a>
          </div>
          @if (moversLoading()) {
            <div class="wp-spinner"><span>Loading movers...</span></div>
          } @else {
            <table class="wp-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th style="width:80px">Chart</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movers(); track m.symbol) {
                  <tr>
                    <td>
                      <div style="display:flex;flex-direction:column">
                        <span style="font-weight:600;font-size:13px">{{ m.symbol }}</span>
                        <span style="font-size:11px;color:var(--text-muted)">{{ m.name }}</span>
                      </div>
                    </td>
                    <td class="mono" style="font-weight:600">{{ m.price | currencyFormat }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="m.changePercent >= 0" [class.badge-danger]="m.changePercent < 0">
                        {{ m.changePercent >= 0 ? '▲' : '▼' }} {{ m.changePercent | percentChange:false }}
                      </span>
                    </td>
                    <td>
                      <app-sparkline
                        [data]="getSparkData(m.changePercent)"
                        [positive]="m.changePercent >= 0"
                        [width]="70" [height]="32">
                      </app-sparkline>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Recent Transactions -->
        <div class="wp-card" style="padding:0;overflow:hidden">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between">
            <h3 style="font-size:15px">Recent Transactions</h3>
            <a routerLink="/app/portfolio" style="font-size:12px;color:var(--primary);text-decoration:none">View All →</a>
          </div>
          <div style="overflow-y:auto;max-height:320px">
            @for (txn of recentTxns(); track txn.id) {
              <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div class="txn-icon" [class.buy]="txn.type==='buy'" [class.sell]="txn.type==='sell'">
                  <span class="material-icons">{{ txn.type === 'buy' ? 'add_shopping_cart' : 'sell' }}</span>
                </div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <span style="font-weight:600;font-size:13px">{{ txn.symbol }}</span>
                    <span class="mono fw-600" [class.text-success]="txn.type==='sell'" [class.text-danger]="txn.type==='buy'">
                      {{ txn.type === 'buy' ? '-' : '+' }}{{ txn.total | currencyFormat }}
                    </span>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">
                    <span style="font-size:11px;color:var(--text-muted)">{{ txn.type | titlecase }} {{ txn.quantity }} @ {{ txn.price | currencyFormat }}</span>
                    <span style="font-size:11px;color:var(--text-muted)">{{ txn.date | date:'MMM d' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .charts-row { @media (max-width: 1100px) { grid-template-columns: 1fr !important; } }
    .bottom-row  { @media (max-width: 900px)  { grid-template-columns: 1fr !important; } }

    .txn-icon {
      width: 38px; height: 38px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 18px; }

      &.buy  { background: var(--danger-dim);  .material-icons { color: var(--danger); } }
      &.sell { background: var(--success-dim); .material-icons { color: var(--success); } }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  portfolio  = inject(PortfolioService);
  rt         = inject(RealTimeService);
  private stockService = inject(StockService);

  chartRanges: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y'];
  activeRange  = signal<ChartRange>('1M');
  perfSeries   = signal<any[]>([]);
  perfXaxis    = signal<ApexXAxis>({});
  moversLoading = signal(false);

  // Live movers derived from realtime ticks
  movers = computed<Mover[]>(() => {
    const ticks = this.rt.ticks();
    const list: Mover[] = [];
    ticks.forEach(tick => {
      list.push({ symbol: tick.symbol, name: tick.symbol, price: tick.price, change: tick.change, changePercent: tick.changePct });
    });
    return list.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);
  });

  private sub?: Subscription;

  now = signal(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  // Performance chart config
  perfChart: ApexChart = { type: 'area', height: 230, toolbar: { show: false }, sparkline: { enabled: false }, animations: { enabled: true, speed: 400, dynamicAnimation: { enabled: true, speed: 350 } }, background: 'transparent', fontFamily: 'Inter, sans-serif', foreColor: 'var(--text-secondary)' };
  perfYaxis: ApexYAxis = { labels: { style: { colors: ['#6B7280'], fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }, formatter: (v: number) => `$${(v/1000).toFixed(0)}k` }, tickAmount: 4 };
  perfStroke: any = { curve: 'smooth', width: 2.5 };
  perfFill:  any = { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 1, gradientToColors: ['rgba(59,130,246,0)'], inverseColors: false, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } };
  perfGrid:  any = { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4, xaxis: { lines: { show: false } } };
  noDataLabels: ApexDataLabels = { enabled: false };
  perfTooltip: ApexTooltip = { theme: 'dark', x: { format: 'MMM dd' }, y: { formatter: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } };

  // Donut chart config — animation disabled to prevent re-play on every price tick
  donutChart: ApexChart = { type: 'donut', height: 200, background: 'transparent', fontFamily: 'Inter, sans-serif', foreColor: 'var(--text-secondary)', animations: { enabled: false } };

  // Stable snapshot: only updates when any percentage shifts by > 0.5 points
  private _donutSnap = signal(this.portfolio.allocation());
  private _donutEffect = effect(() => {
    const next = this.portfolio.allocation();
    const prev = this._donutSnap();
    const changed = next.length !== prev.length ||
      next.some(n => {
        const p = prev.find(x => x.label === n.label);
        return !p || Math.abs(n.percentage - p.percentage) > 0.5;
      });
    if (changed) this._donutSnap.set(next);
  });

  donutSeries = computed(() => this._donutSnap().map(a => Math.round(a.percentage)));
  donutLabels = computed(() => this._donutSnap().map(a => a.label));
  donutColors = computed(() => this._donutSnap().map(a => a.color));
  donutDataLabels: ApexDataLabels = { enabled: false };
  donutPlotOptions: ApexPlotOptions = { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', formatter: () => 'Portfolio' } } } } };
  donutLegend: ApexLegend = { show: false };
  donutTooltip: ApexTooltip = { theme: 'dark', y: { formatter: (v: number) => `${v}%` } };

  recentTxns = computed(() => this.portfolio.transactions().slice(0, 8));

  ngOnInit(): void {
    this.loadPerformance();
    // Clock update every minute
    this.sub = interval(60000).subscribe(() =>
      this.now.set(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    );
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  setRange(r: ChartRange): void {
    this.activeRange.set(r);
    this.loadPerformance();
  }

  private loadPerformance(): void {
    const days = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }[this.activeRange()] ?? 30;
    const points = this.portfolio.getPerformanceHistory(days);
    this.perfSeries.set([{ name: 'Portfolio Value', data: points.map(p => p.value) }]);
    this.perfXaxis.set({
      categories: points.map(p => p.date),
      labels: { style: { colors: '#6B7280', fontFamily: 'Inter', fontSize: '11px' }, rotate: 0 },
      axisBorder: { show: false }, axisTicks: { show: false },
      tickAmount: 6,
    });
  }

  getSparkData(changePercent: number): number[] {
    const base = 100;
    const trend = changePercent > 0 ? 0.01 : -0.01;
    return Array.from({ length: 20 }, (_, i) => base + i * trend * base + (Math.random() - 0.5) * 5);
  }
}
