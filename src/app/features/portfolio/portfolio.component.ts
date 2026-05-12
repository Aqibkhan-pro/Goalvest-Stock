import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NgApexchartsModule } from 'ng-apexcharts';

import { PortfolioService }      from '../../core/services/portfolio.service';
import { StatCardComponent }     from '../../shared/components/stat-card/stat-card.component';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart/sparkline-chart.component';
import { CurrencyFormatPipe }    from '../../shared/pipes/currency-format.pipe';
import { PercentChangePipe }     from '../../shared/pipes/percent-change.pipe';
import { Position }              from '../../core/models/portfolio.model';

type SortKey  = 'symbol' | 'marketValue' | 'gainLoss' | 'gainLossPct';
type SortDir  = 'asc' | 'desc';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatSnackBarModule, MatDialogModule, NgApexchartsModule,
    StatCardComponent, SparklineChartComponent,
    CurrencyFormatPipe, PercentChangePipe, TitleCasePipe
  ],
  template: `
    <div class="page-container fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Portfolio</h1>
          <p>{{ portfolio.positions().length }} positions · last updated just now</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span class="material-icons">add</span> Add Position
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4" style="margin-bottom:24px">
        <app-stat-card label="Portfolio Value"   [value]="portfolio.summary().totalValue"            [isCurrency]="true" icon="account_balance_wallet" iconBg="linear-gradient(135deg,#3B82F6,#7C3AED)"></app-stat-card>
        <app-stat-card label="Total Return"      [value]="portfolio.summary().totalGainLoss"          [isCurrency]="true" icon="trending_up" [iconBg]="portfolio.summary().totalGainLoss>=0?'linear-gradient(135deg,#10B981,#059669)':'linear-gradient(135deg,#EF4444,#DC2626)'"></app-stat-card>
        <app-stat-card label="Return %"          [value]="portfolio.summary().totalGainLossPercent"   [isPercent]="true"  icon="percent"  iconBg="linear-gradient(135deg,#F59E0B,#D97706)"></app-stat-card>
        <app-stat-card label="Cash Balance"      [value]="portfolio.summary().cashBalance"            [isCurrency]="true" icon="payments" iconBg="linear-gradient(135deg,#10B981,#065F46)"></app-stat-card>
      </div>

      <!-- Filter / Search -->
      <div class="wp-card" style="padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="position:relative;flex:1;min-width:200px">
          <span class="material-icons" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted)">search</span>
          <input class="wp-input" style="padding-left:36px" placeholder="Search symbol or name…" [(ngModel)]="searchQuery">
        </div>
        <div class="wp-tabs">
          @for (t of assetTypes; track t.value) {
            <button class="tab-btn" [class.active]="filterType() === t.value" (click)="filterType.set(t.value)">{{ t.label }}</button>
          }
        </div>
      </div>

      <!-- Holdings Table -->
      <div class="wp-card" style="padding:0;overflow:hidden;margin-bottom:24px">
        <div style="overflow-x:auto">
          <table class="wp-table">
            <thead>
              <tr>
                <th (click)="sort('symbol')">Symbol {{ sortIcon('symbol') }}</th>
                <th>Qty</th>
                <th>Avg Cost</th>
                <th>Current</th>
                <th (click)="sort('marketValue')">Mkt Value {{ sortIcon('marketValue') }}</th>
                <th (click)="sort('gainLoss')">Gain/Loss $ {{ sortIcon('gainLoss') }}</th>
                <th (click)="sort('gainLossPct')">Gain/Loss % {{ sortIcon('gainLossPct') }}</th>
                <th>7D Chart</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pos of filteredPositions(); track pos.id) {
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="symbol-badge" [attr.data-type]="pos.assetType">
                        {{ pos.symbol.slice(0,1) }}
                      </div>
                      <div>
                        <div style="font-weight:700;font-size:13px">{{ pos.symbol }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ pos.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono">{{ pos.quantity }}</td>
                  <td class="mono">{{ pos.avgCost | currencyFormat }}</td>
                  <td class="mono fw-600">{{ pos.currentPrice | currencyFormat }}</td>
                  <td class="mono fw-600">{{ (pos.currentPrice * pos.quantity) | currencyFormat }}</td>
                  <td class="mono fw-600"
                      [class.text-success]="(pos.currentPrice - pos.avgCost) * pos.quantity >= 0"
                      [class.text-danger]="(pos.currentPrice - pos.avgCost) * pos.quantity < 0">
                    {{ (pos.currentPrice - pos.avgCost) * pos.quantity | currencyFormat }}
                  </td>
                  <td>
                    <span class="badge"
                          [class.badge-success]="(pos.currentPrice - pos.avgCost) / pos.avgCost * 100 >= 0"
                          [class.badge-danger]="(pos.currentPrice - pos.avgCost) / pos.avgCost * 100 < 0">
                      {{ (pos.currentPrice - pos.avgCost) / pos.avgCost * 100 | percentChange }}
                    </span>
                  </td>
                  <td>
                    <app-sparkline
                      [data]="getSparkData(pos)"
                      [positive]="pos.currentPrice >= pos.avgCost"
                      [width]="80" [height]="32">
                    </app-sparkline>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn-icon" (click)="openEditModal(pos)" title="Edit">
                        <span class="material-icons">edit</span>
                      </button>
                      <button class="btn-icon" (click)="confirmDelete(pos)" title="Delete" style="border-color:var(--danger-dim);color:var(--danger)">
                        <span class="material-icons">delete_outline</span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="9">
                  <div class="empty-state">
                    <span class="material-icons">account_balance_wallet</span>
                    <p>No positions found. Add your first investment!</p>
                    <button class="btn-primary" (click)="openAddModal()"><span class="material-icons">add</span> Add Position</button>
                  </div>
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="wp-card" style="padding:0;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-subtle)">
          <h3 style="font-size:15px">Transaction History</h3>
        </div>
        <div style="overflow-x:auto">
          <table class="wp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @for (txn of portfolio.transactions().slice(0, 15); track txn.id) {
                <tr>
                  <td style="color:var(--text-muted);font-size:12px">{{ txn.date | date:'MMM d, yyyy' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="txn.type==='sell'" [class.badge-danger]="txn.type==='buy'">
                      {{ txn.type | titlecase }}
                    </span>
                  </td>
                  <td style="font-weight:600">{{ txn.symbol }}</td>
                  <td class="mono">{{ txn.quantity }}</td>
                  <td class="mono">{{ txn.price | currencyFormat }}</td>
                  <td class="mono fw-600" [class.text-danger]="txn.type==='buy'" [class.text-success]="txn.type==='sell'">
                    {{ txn.type === 'buy' ? '-' : '+' }}{{ txn.total | currencyFormat }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Position' : 'Add Position' }}</h3>
            <button class="btn-icon" (click)="closeModal()"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="posForm">
              <div class="modal-grid">
                <div class="form-group">
                  <label>Symbol *</label>
                  <input formControlName="symbol" class="wp-input" placeholder="AAPL" style="text-transform:uppercase">
                </div>
                <div class="form-group">
                  <label>Company Name *</label>
                  <input formControlName="name" class="wp-input" placeholder="Apple Inc.">
                </div>
                <div class="form-group">
                  <label>Quantity *</label>
                  <input formControlName="quantity" type="number" class="wp-input" placeholder="10" min="0.001">
                </div>
                <div class="form-group">
                  <label>Avg Cost per Share *</label>
                  <input formControlName="avgCost" type="number" class="wp-input" placeholder="150.00" min="0.01">
                </div>
                <div class="form-group">
                  <label>Current Price</label>
                  <input formControlName="currentPrice" type="number" class="wp-input" placeholder="189.84" min="0.01">
                </div>
                <div class="form-group">
                  <label>Asset Type</label>
                  <select formControlName="assetType" class="wp-input">
                    <option value="stock">Stock</option>
                    <option value="crypto">Crypto</option>
                    <option value="etf">ETF</option>
                    <option value="bond">Bond</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="savePosition()" [disabled]="posForm.invalid">
              {{ editingId() ? 'Save Changes' : 'Add Position' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="deleteTarget.set(null)">
        <div class="modal-panel" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Remove Position</h3>
            <button class="btn-icon" (click)="deleteTarget.set(null)"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6">
              Are you sure you want to remove <strong>{{ deleteTarget()?.symbol }}</strong> ({{ deleteTarget()?.name }}) from your portfolio?
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger" (click)="doDelete()">Remove Position</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .symbol-badge {
      width: 36px; height: 36px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, var(--primary), #7C3AED);
      flex-shrink: 0;

      &[data-type="crypto"] { background: linear-gradient(135deg, #F59E0B, #D97706); }
      &[data-type="etf"]    { background: linear-gradient(135deg, #10B981, #059669); }
      &[data-type="bond"]   { background: linear-gradient(135deg, #6B7280, #374151); }
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fade-in 0.2s ease;
    }

    .modal-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 560px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      animation: fade-in-up 0.25s ease;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-subtle);
      h3 { font-size: 16px; font-weight: 700; }
    }

    .modal-body  { padding: 24px; }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class PortfolioComponent implements OnInit {
  portfolio   = inject(PortfolioService);
  private fb  = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  searchQuery  = '';
  filterType   = signal<string>('all');
  sortKey      = signal<SortKey>('marketValue');
  sortDir      = signal<SortDir>('desc');
  showModal    = signal(false);
  editingId    = signal<string | null>(null);
  deleteTarget = signal<Position | null>(null);

  assetTypes = [
    { value: 'all', label: 'All' },
    { value: 'stock',  label: 'Stocks' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'etf',    label: 'ETFs' },
  ];

  posForm = this.fb.group({
    symbol:       ['', [Validators.required, Validators.minLength(1)]],
    name:         ['', Validators.required],
    quantity:     [null as number | null, [Validators.required, Validators.min(0.000001)]],
    avgCost:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    currentPrice: [null as number | null, [Validators.min(0.01)]],
    assetType:    ['stock'],
  });

  filteredPositions = computed(() => {
    let pos = this.portfolio.positions();
    const q = this.searchQuery.toLowerCase();
    if (q) pos = pos.filter(p => p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    if (this.filterType() !== 'all') pos = pos.filter(p => p.assetType === this.filterType());

    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...pos].sort((a, b) => {
      const va = this.sortVal(a, key);
      const vb = this.sortVal(b, key);
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  });

  ngOnInit(): void {}

  private sortVal(p: Position, key: SortKey): number | string {
    switch (key) {
      case 'symbol':      return p.symbol;
      case 'marketValue': return p.currentPrice * p.quantity;
      case 'gainLoss':    return (p.currentPrice - p.avgCost) * p.quantity;
      case 'gainLossPct': return (p.currentPrice - p.avgCost) / p.avgCost;
    }
  }

  sort(key: SortKey): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(key); this.sortDir.set('desc'); }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  getSparkData(pos: Position): number[] {
    const base = pos.avgCost;
    const up   = pos.currentPrice >= pos.avgCost;
    return Array.from({ length: 20 }, (_, i) => base * (1 + i * (up ? 0.003 : -0.003) + (Math.random() - 0.5) * 0.02));
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.posForm.reset({ assetType: 'stock' });
    this.showModal.set(true);
  }

  openEditModal(pos: Position): void {
    this.editingId.set(pos.id);
    this.posForm.patchValue({ symbol: pos.symbol, name: pos.name, quantity: pos.quantity, avgCost: pos.avgCost, currentPrice: pos.currentPrice, assetType: pos.assetType });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  savePosition(): void {
    if (this.posForm.invalid) return;
    const v = this.posForm.value;
    const data = {
      symbol:       (v.symbol ?? '').toUpperCase(),
      name:         v.name ?? '',
      quantity:     v.quantity ?? 0,
      avgCost:      v.avgCost ?? 0,
      currentPrice: v.currentPrice ?? v.avgCost ?? 0,
      assetType:    (v.assetType ?? 'stock') as Position['assetType'],
    };

    const id = this.editingId();
    if (id) {
      this.portfolio.editPosition(id, data);
      this.snack.open('Position updated', 'OK', { duration: 3000 });
    } else {
      this.portfolio.addPosition(data);
      this.snack.open('Position added to portfolio', 'OK', { duration: 3000 });
    }
    this.closeModal();
  }

  confirmDelete(pos: Position): void { this.deleteTarget.set(pos); }

  doDelete(): void {
    const pos = this.deleteTarget();
    if (!pos) return;
    this.portfolio.deletePosition(pos.id);
    this.deleteTarget.set(null);
    this.snack.open(`${pos.symbol} removed from portfolio`, 'OK', { duration: 3000 });
  }
}
