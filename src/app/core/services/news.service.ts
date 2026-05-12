import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  category: string;
  related?: string;
}

const MOCK_NEWS: NewsArticle[] = [
  { id: '1', headline: 'Fed Signals Potential Rate Cuts as Inflation Cools Toward 2% Target', summary: 'Federal Reserve officials indicated they may begin reducing interest rates later this year as inflation continues its decline toward the central bank\'s 2% target, according to minutes from the latest FOMC meeting.', source: 'Reuters', url: '#', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400', datetime: Date.now() - 3600000, category: 'economy' },
  { id: '2', headline: 'NVIDIA Surpasses $2 Trillion Market Cap on AI Chip Demand Surge', summary: 'NVIDIA\'s market capitalization exceeded $2 trillion for the first time, driven by insatiable demand for its AI-focused graphics processing units as tech companies race to build out artificial intelligence infrastructure.', source: 'Bloomberg', url: '#', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', datetime: Date.now() - 7200000, category: 'stocks' },
  { id: '3', headline: 'Bitcoin Hits New All-Time High Above $73,000 Amid ETF Inflows', summary: 'Bitcoin surged to a new all-time high above $73,000, fueled by record inflows into spot Bitcoin ETFs and growing institutional adoption of the world\'s largest cryptocurrency by market capitalization.', source: 'CoinDesk', url: '#', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400', datetime: Date.now() - 10800000, category: 'crypto' },
  { id: '4', headline: 'Apple Reports Record Q1 Revenue of $119.6B, Services Growth Accelerates', summary: 'Apple Inc. delivered record first-quarter revenue driven by strong iPhone sales in emerging markets and accelerating growth in its high-margin services segment, including the App Store and Apple TV+.', source: 'CNBC', url: '#', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400', datetime: Date.now() - 14400000, category: 'earnings' },
  { id: '5', headline: 'S&P 500 Closes at Record High as Tech Stocks Lead Market Rally', summary: 'The S&P 500 index closed at a fresh record high, with technology stocks leading the broad-market rally as investors bet on continued strong earnings growth and a soft economic landing.', source: 'Wall Street Journal', url: '#', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400', datetime: Date.now() - 18000000, category: 'stocks' },
  { id: '6', headline: 'Ethereum Upgrade Reduces Transaction Fees by 90%, Boosting DeFi Activity', summary: 'The latest Ethereum network upgrade has dramatically reduced transaction fees through improved data availability, sparking a new wave of activity in decentralized finance applications built on the network.', source: 'The Block', url: '#', image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400', datetime: Date.now() - 21600000, category: 'crypto' },
  { id: '7', headline: 'Tesla Beats Q2 Delivery Estimates, Stock Surges 8% in Pre-Market', summary: 'Tesla reported better-than-expected vehicle deliveries for the second quarter, allaying concerns about slowing EV demand. The electric vehicle maker delivered 443,956 vehicles globally, exceeding analyst estimates.', source: 'MarketWatch', url: '#', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400', datetime: Date.now() - 25200000, category: 'earnings' },
  { id: '8', headline: 'US GDP Growth Revised Upward to 3.4% in Q4, Beating Expectations', summary: 'The US economy grew faster than initially estimated in the final quarter, with GDP revised upward to an annualized rate of 3.4%, demonstrating remarkable resilience in the face of elevated interest rates.', source: 'Financial Times', url: '#', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', datetime: Date.now() - 28800000, category: 'economy' },
  { id: '9', headline: 'Microsoft Azure Revenue Jumps 31% on AI Service Demand', summary: 'Microsoft\'s cloud computing division reported 31% revenue growth, accelerating from the prior quarter, as enterprises rapidly adopted AI services built on top of Azure infrastructure.', source: 'Reuters', url: '#', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400', datetime: Date.now() - 32400000, category: 'earnings' },
  { id: '10', headline: 'Gold Reaches $2,300 Per Ounce as Safe-Haven Demand Spikes', summary: 'Gold prices surged to an all-time high above $2,300 per ounce as geopolitical uncertainty and concerns about long-term dollar weakness drove investors toward the traditional safe-haven asset.', source: 'Bloomberg', url: '#', image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400', datetime: Date.now() - 36000000, category: 'economy' },
];

export type NewsCategory = 'all' | 'stocks' | 'crypto' | 'economy' | 'earnings';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly finnhubBase = environment.finnhubBaseUrl;
  private readonly finnhubKey  = environment.finnhubApiKey;

  constructor(private http: HttpClient) {}

  getMarketNews(category: NewsCategory = 'all'): Observable<NewsArticle[]> {
    if (this.finnhubKey === 'demo') {
      const filtered = category === 'all' ? MOCK_NEWS : MOCK_NEWS.filter(n => n.category === category);
      return of(filtered);
    }
    const params = new HttpParams().set('category', 'general').set('token', this.finnhubKey);
    return this.http.get<NewsArticle[]>(`${this.finnhubBase}/news`, { params }).pipe(
      catchError(() => {
        const filtered = category === 'all' ? MOCK_NEWS : MOCK_NEWS.filter(n => n.category === category);
        return of(filtered);
      })
    );
  }
}
