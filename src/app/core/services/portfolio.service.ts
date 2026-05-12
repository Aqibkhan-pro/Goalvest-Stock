import { Injectable, signal, computed } from '@angular/core';
import { Position, Transaction, PortfolioSummary, AssetAllocation, PerformancePoint } from '../models/portfolio.model';

const POSITIONS_KEY    = 'wp_positions';
const TRANSACTIONS_KEY = 'wp_transactions';
const CASH_KEY         = 'wp_cash';

const SEED_POSITIONS: Position[] = [
  { id: '1', symbol: 'AAPL',  name: 'Apple Inc.',    quantity: 15,  avgCost: 165.20, currentPrice: 189.84, assetType: 'stock',  addedAt: Date.now() - 86400000 * 90 },
  { id: '2', symbol: 'MSFT',  name: 'Microsoft',     quantity: 8,   avgCost: 390.50, currentPrice: 415.32, assetType: 'stock',  addedAt: Date.now() - 86400000 * 60 },
  { id: '3', symbol: 'NVDA',  name: 'NVIDIA Corp',   quantity: 5,   avgCost: 720.00, currentPrice: 875.40, assetType: 'stock',  addedAt: Date.now() - 86400000 * 45 },
  { id: '4', symbol: 'BTC',   name: 'Bitcoin',       quantity: 0.5, avgCost: 58000,  currentPrice: 67420,  assetType: 'crypto', addedAt: Date.now() - 86400000 * 30 },
  { id: '5', symbol: 'ETH',   name: 'Ethereum',      quantity: 3,   avgCost: 3100,   currentPrice: 3542,   assetType: 'crypto', addedAt: Date.now() - 86400000 * 20 },
  { id: '6', symbol: 'TSLA',  name: 'Tesla Inc.',    quantity: 10,  avgCost: 235.00, currentPrice: 248.16, assetType: 'stock',  addedAt: Date.now() - 86400000 * 15 },
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', symbol: 'AAPL', name: 'Apple Inc.',    type: 'buy',  quantity: 15,  price: 165.20, total: 2478.00, date: Date.now() - 86400000 * 90 },
  { id: 't2', symbol: 'MSFT', name: 'Microsoft',     type: 'buy',  quantity: 8,   price: 390.50, total: 3124.00, date: Date.now() - 86400000 * 60 },
  { id: 't3', symbol: 'NVDA', name: 'NVIDIA Corp',   type: 'buy',  quantity: 5,   price: 720.00, total: 3600.00, date: Date.now() - 86400000 * 45 },
  { id: 't4', symbol: 'BTC',  name: 'Bitcoin',       type: 'buy',  quantity: 0.5, price: 58000,  total: 29000.00, date: Date.now() - 86400000 * 30 },
  { id: 't5', symbol: 'ETH',  name: 'Ethereum',      type: 'buy',  quantity: 3,   price: 3100,   total: 9300.00, date: Date.now() - 86400000 * 20 },
  { id: 't6', symbol: 'TSLA', name: 'Tesla Inc.',    type: 'buy',  quantity: 10,  price: 235.00, total: 2350.00, date: Date.now() - 86400000 * 15 },
  { id: 't7', symbol: 'AAPL', name: 'Apple Inc.',    type: 'sell', quantity: 2,   price: 192.00, total: 384.00,  date: Date.now() - 86400000 * 5 },
];

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  readonly positions    = signal<Position[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly cashBalance  = signal<number>(25000);

  readonly summary = computed<PortfolioSummary>(() => {
    const pos = this.positions();
    const totalValue = pos.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0) + this.cashBalance();
    const totalCost  = pos.reduce((sum, p) => sum + p.avgCost    * p.quantity, 0);
    const totalGL    = pos.reduce((sum, p) => sum + (p.currentPrice - p.avgCost) * p.quantity, 0);
    const todayGL    = pos.reduce((sum, p) => sum + (p.currentPrice * 0.012) * p.quantity, 0);

    return {
      totalValue,
      totalCost,
      totalGainLoss: totalGL,
      totalGainLossPercent: totalCost > 0 ? (totalGL / totalCost) * 100 : 0,
      todayGainLoss: todayGL,
      todayGainLossPercent: totalValue > 0 ? (todayGL / (totalValue - todayGL)) * 100 : 0,
      cashBalance: this.cashBalance(),
      allTimeReturn: totalGL,
      allTimeReturnPercent: totalCost > 0 ? (totalGL / totalCost) * 100 : 0,
    };
  });

  readonly allocation = computed<AssetAllocation[]>(() => {
    const pos = this.positions();
    const stocks = pos.filter(p => p.assetType === 'stock').reduce((s, p) => s + p.currentPrice * p.quantity, 0);
    const crypto  = pos.filter(p => p.assetType === 'crypto').reduce((s, p) => s + p.currentPrice * p.quantity, 0);
    const bonds   = 0;
    const cash    = this.cashBalance();
    const total   = stocks + crypto + bonds + cash;

    return [
      { label: 'Stocks', value: stocks, percentage: total > 0 ? (stocks / total) * 100 : 0, color: '#3B82F6' },
      { label: 'Crypto', value: crypto,  percentage: total > 0 ? (crypto  / total) * 100 : 0, color: '#8B5CF6' },
      { label: 'Bonds',  value: bonds,   percentage: 0,                                         color: '#F59E0B' },
      { label: 'Cash',   value: cash,    percentage: total > 0 ? (cash  / total) * 100 : 0, color: '#10B981' },
    ].filter(a => a.value > 0);
  });

  constructor() { this.load(); }

  private load(): void {
    const pos = localStorage.getItem(POSITIONS_KEY);
    const txn = localStorage.getItem(TRANSACTIONS_KEY);
    const cash = localStorage.getItem(CASH_KEY);

    this.positions.set(pos ? JSON.parse(pos) : SEED_POSITIONS);
    this.transactions.set(txn ? JSON.parse(txn) : SEED_TRANSACTIONS);
    this.cashBalance.set(cash ? +cash : 25000);
  }

  private save(): void {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(this.positions()));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(this.transactions()));
    localStorage.setItem(CASH_KEY, String(this.cashBalance()));
  }

  addPosition(pos: Omit<Position, 'id' | 'addedAt'>): void {
    const existing = this.positions().find(p => p.symbol === pos.symbol);
    if (existing) {
      const totalQty  = existing.quantity + pos.quantity;
      const totalCost = existing.avgCost * existing.quantity + pos.avgCost * pos.quantity;
      this.positions.update(ps => ps.map(p => p.id === existing.id ? { ...p, quantity: totalQty, avgCost: totalCost / totalQty, currentPrice: pos.currentPrice } : p));
    } else {
      const newPos: Position = { ...pos, id: crypto.randomUUID(), addedAt: Date.now() };
      this.positions.update(ps => [...ps, newPos]);
    }
    const txn: Transaction = { id: crypto.randomUUID(), symbol: pos.symbol, name: pos.name, type: 'buy', quantity: pos.quantity, price: pos.avgCost, total: pos.quantity * pos.avgCost, date: Date.now() };
    this.transactions.update(ts => [txn, ...ts]);
    this.save();
  }

  editPosition(id: string, updates: Partial<Position>): void {
    this.positions.update(ps => ps.map(p => p.id === id ? { ...p, ...updates } : p));
    this.save();
  }

  deletePosition(id: string): void {
    const pos = this.positions().find(p => p.id === id);
    if (pos) {
      const txn: Transaction = { id: crypto.randomUUID(), symbol: pos.symbol, name: pos.name, type: 'sell', quantity: pos.quantity, price: pos.currentPrice, total: pos.quantity * pos.currentPrice, date: Date.now() };
      this.transactions.update(ts => [txn, ...ts]);
    }
    this.positions.update(ps => ps.filter(p => p.id !== id));
    this.save();
  }

  updatePrices(prices: Record<string, number>): void {
    this.positions.update(ps => ps.map(p => ({ ...p, currentPrice: prices[p.symbol] ?? p.currentPrice })));
    this.save();
  }

  getPerformanceHistory(days = 30): PerformancePoint[] {
    const totalValue = this.summary().totalValue;
    const points: PerformancePoint[] = [];
    let val = totalValue * 0.85;
    for (let i = days; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      val = val * (1 + (Math.random() - 0.47) * 0.025);
      points.push({ date: d.toISOString().split('T')[0], value: +val.toFixed(2) });
    }
    points[points.length - 1].value = totalValue;
    return points;
  }
}
