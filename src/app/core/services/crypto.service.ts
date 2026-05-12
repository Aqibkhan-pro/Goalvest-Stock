import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CryptoMarket, CryptoGlobalData } from '../models/crypto.model';

const MOCK_CRYPTOS: CryptoMarket[] = [
  { id: 'bitcoin',   symbol: 'btc',  name: 'Bitcoin',   image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',   current_price: 67420,  market_cap: 1326000000000, market_cap_rank: 1,  fully_diluted_valuation: 1415000000000, total_volume: 28500000000, high_24h: 68200, low_24h: 66800, price_change_24h: 820,   price_change_percentage_24h: 1.23,  market_cap_change_24h: 16200000000,  market_cap_change_percentage_24h: 1.23,  circulating_supply: 19700000,  total_supply: 21000000,       max_supply: 21000000,       ath: 73750, ath_change_percentage: -8.56, ath_date: '2024-03-14', atl: 67.81, atl_change_percentage: 99344, atl_date: '2013-07-06', last_updated: new Date().toISOString() },
  { id: 'ethereum',  symbol: 'eth',  name: 'Ethereum',  image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',  current_price: 3542,   market_cap: 425000000000, market_cap_rank: 2,  fully_diluted_valuation: 425000000000,  total_volume: 14200000000, high_24h: 3600,  low_24h: 3490,  price_change_24h: 52,    price_change_percentage_24h: 1.49,  market_cap_change_24h: 6300000000,   market_cap_change_percentage_24h: 1.49,  circulating_supply: 120000000,  total_supply: null,           max_supply: null,           ath: 4878, ath_change_percentage: -27.3, ath_date: '2021-11-10', atl: 0.43, atl_change_percentage: 819752, atl_date: '2015-10-20', last_updated: new Date().toISOString() },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB',      image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 608,  market_cap: 88500000000,  market_cap_rank: 3,  fully_diluted_valuation: 88500000000,   total_volume: 2100000000,  high_24h: 618,   low_24h: 598,   price_change_24h: -9,    price_change_percentage_24h: -1.46, market_cap_change_24h: -1300000000,  market_cap_change_percentage_24h: -1.46, circulating_supply: 145000000,  total_supply: 145000000,      max_supply: 200000000,      ath: 686, ath_change_percentage: -11.4, ath_date: '2024-06-06', atl: 0.039, atl_change_percentage: 1556870, atl_date: '2017-10-19', last_updated: new Date().toISOString() },
  { id: 'solana',    symbol: 'sol',  name: 'Solana',    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',   current_price: 178,    market_cap: 82400000000,  market_cap_rank: 4,  fully_diluted_valuation: 102000000000,  total_volume: 3800000000,  high_24h: 182,   low_24h: 174,   price_change_24h: 3.2,   price_change_percentage_24h: 1.83,  market_cap_change_24h: 1500000000,   market_cap_change_percentage_24h: 1.83,  circulating_supply: 463000000,  total_supply: 574000000,      max_supply: null,           ath: 259.96, ath_change_percentage: -31.5, ath_date: '2021-11-06', atl: 0.5, atl_change_percentage: 35458, atl_date: '2020-05-11', last_updated: new Date().toISOString() },
  { id: 'ripple',    symbol: 'xrp',  name: 'XRP',       image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0.634, market_cap: 35800000000, market_cap_rank: 5, fully_diluted_valuation: 63400000000,  total_volume: 1200000000,  high_24h: 0.645, low_24h: 0.625, price_change_24h: -0.01, price_change_percentage_24h: -0.85, market_cap_change_24h: -300000000,   market_cap_change_percentage_24h: -0.85, circulating_supply: 56500000000, total_supply: 100000000000, max_supply: 100000000000, ath: 3.40, ath_change_percentage: -81.4, ath_date: '2018-01-07', atl: 0.00268, atl_change_percentage: 23559, atl_date: '2014-05-22', last_updated: new Date().toISOString() },
  { id: 'cardano',   symbol: 'ada',  name: 'Cardano',   image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',  current_price: 0.458,  market_cap: 16200000000,  market_cap_rank: 9,  fully_diluted_valuation: 20600000000,   total_volume: 450000000,   high_24h: 0.468, low_24h: 0.450, price_change_24h: 0.005, price_change_percentage_24h: 1.20,  market_cap_change_24h: 192000000,    market_cap_change_percentage_24h: 1.20,  circulating_supply: 35400000000, total_supply: 45000000000,  max_supply: 45000000000,    ath: 3.10, ath_change_percentage: -85.2, ath_date: '2021-09-02', atl: 0.0177, atl_change_percentage: 2489, atl_date: '2018-10-01', last_updated: new Date().toISOString() },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', current_price: 36.4, market_cap: 15000000000, market_cap_rank: 10, fully_diluted_valuation: 25800000000, total_volume: 650000000, high_24h: 37.5, low_24h: 35.8, price_change_24h: 0.5, price_change_percentage_24h: 1.38, market_cap_change_24h: 207000000, market_cap_change_percentage_24h: 1.38, circulating_supply: 411000000, total_supply: 720000000, max_supply: 720000000, ath: 144.96, ath_change_percentage: -74.9, ath_date: '2021-11-21', atl: 2.80, atl_change_percentage: 1202, atl_date: '2020-12-31', last_updated: new Date().toISOString() },
  { id: 'dogecoin',  symbol: 'doge', name: 'Dogecoin',  image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',  current_price: 0.163, market_cap: 23600000000, market_cap_rank: 8, fully_diluted_valuation: null, total_volume: 1100000000, high_24h: 0.168, low_24h: 0.159, price_change_24h: -0.003, price_change_percentage_24h: -1.72, market_cap_change_24h: -414000000, market_cap_change_percentage_24h: -1.72, circulating_supply: 144800000000, total_supply: null, max_supply: null, ath: 0.7376, ath_change_percentage: -77.9, ath_date: '2021-05-08', atl: 0.000082, atl_change_percentage: 198714, atl_date: '2015-05-06', last_updated: new Date().toISOString() },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', current_price: 15.2, market_cap: 9100000000, market_cap_rank: 14, fully_diluted_valuation: 15200000000, total_volume: 480000000, high_24h: 15.6, low_24h: 14.9, price_change_24h: 0.22, price_change_percentage_24h: 1.47, market_cap_change_24h: 133000000, market_cap_change_percentage_24h: 1.47, circulating_supply: 599000000, total_supply: 1000000000, max_supply: 1000000000, ath: 52.88, ath_change_percentage: -71.2, ath_date: '2021-05-10', atl: 0.148, atl_change_percentage: 10173, atl_date: '2017-11-29', last_updated: new Date().toISOString() },
  { id: 'polkadot',  symbol: 'dot',  name: 'Polkadot',  image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', current_price: 7.82, market_cap: 10400000000, market_cap_rank: 13, fully_diluted_valuation: 20500000000, total_volume: 310000000, high_24h: 8.05, low_24h: 7.70, price_change_24h: -0.14, price_change_percentage_24h: -1.76, market_cap_change_24h: -185000000, market_cap_change_percentage_24h: -1.76, circulating_supply: 1330000000, total_supply: 1400000000, max_supply: null, ath: 54.98, ath_change_percentage: -85.8, ath_date: '2021-11-04', atl: 2.70, atl_change_percentage: 189, atl_date: '2020-08-20', last_updated: new Date().toISOString() },
];

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly base = environment.coingeckoBaseUrl;
  private cache$?: Observable<CryptoMarket[]>;

  constructor(private http: HttpClient) {}

  getTopCoins(perPage = 20): Observable<CryptoMarket[]> {
    const params = new HttpParams()
      .set('vs_currency', 'usd')
      .set('order', 'market_cap_desc')
      .set('per_page', perPage)
      .set('page', 1)
      .set('sparkline', false)
      .set('price_change_percentage', '24h');

    return this.http.get<CryptoMarket[]>(`${this.base}/coins/markets`, { params }).pipe(
      catchError(() => {
        const noised = MOCK_CRYPTOS.slice(0, perPage).map(c => ({
          ...c,
          current_price: +(c.current_price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(c.current_price > 1 ? 2 : 6),
          price_change_percentage_24h: +(c.price_change_percentage_24h + (Math.random() - 0.5) * 0.5).toFixed(2),
        }));
        return of(noised);
      }),
      shareReplay(1)
    );
  }

  getCoinDetail(id: string): Observable<any> {
    return this.http.get(`${this.base}/coins/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  getGlobalData(): Observable<{ data: CryptoGlobalData }> {
    return this.http.get<{ data: CryptoGlobalData }>(`${this.base}/global`).pipe(
      catchError(() => of({ data: { active_cryptocurrencies: 14234, markets: 1026, total_market_cap: { usd: 2460000000000 }, total_volume: { usd: 98000000000 }, market_cap_percentage: { btc: 53.9, eth: 17.3 }, market_cap_change_percentage_24h_usd: 1.2 } }))
    );
  }

  getPriceHistory(id: string, days: number): Observable<{ prices: [number, number][] }> {
    const params = new HttpParams().set('vs_currency', 'usd').set('days', days);
    return this.http.get<{ prices: [number, number][] }>(`${this.base}/coins/${id}/market_chart`, { params }).pipe(
      catchError(() => {
        const prices: [number, number][] = [];
        const base = id === 'bitcoin' ? 65000 : id === 'ethereum' ? 3400 : 100;
        for (let i = days; i >= 0; i--) {
          const t = Date.now() - i * 86400000;
          const v = base * (1 + (Math.random() - 0.48) * 0.05);
          prices.push([t, +v.toFixed(2)]);
        }
        return of({ prices });
      })
    );
  }
}
