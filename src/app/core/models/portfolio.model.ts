export interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  assetType: 'stock' | 'crypto' | 'etf' | 'bond';
  addedAt: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  todayGainLoss: number;
  todayGainLossPercent: number;
  cashBalance: number;
  allTimeReturn: number;
  allTimeReturnPercent: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  date: number;
}

export interface AssetAllocation {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
}
