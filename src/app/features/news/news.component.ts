import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService, NewsArticle, NewsCategory } from '../../core/services/news.service';

@Component({
  selector: 'app-news',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe],
  template: `
    <div class="page-container fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Financial News</h1>
          <p>Stay informed with curated market news and analysis</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge badge-primary">{{ filteredArticles().length }} articles</span>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <div class="wp-tabs">
          @for (cat of categories; track cat.value) {
            <button class="tab-btn" [class.active]="activeCategory() === cat.value" (click)="setCategory(cat.value)">
              {{ cat.label }}
            </button>
          }
        </div>
        <div style="position:relative;margin-left:auto">
          <span class="material-icons" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted)">search</span>
          <input class="wp-input" style="padding-left:36px;width:220px" placeholder="Search news…" [(ngModel)]="searchQuery">
        </div>
      </div>

      <!-- Featured Article -->
      @if (filteredArticles().length > 0) {
        <div class="featured-card wp-card" style="padding:0;overflow:hidden;margin-bottom:24px">
          <div style="display:grid;grid-template-columns:1.2fr 1fr">
            <div style="position:relative;overflow:hidden;min-height:280px">
              <img [src]="filteredArticles()[0].image" [alt]="filteredArticles()[0].headline"
                   style="width:100%;height:100%;object-fit:cover;display:block">
              <div style="position:absolute;inset:0;background:linear-gradient(to right,transparent,var(--bg-card))"></div>
            </div>
            <div style="padding:32px;display:flex;flex-direction:column;justify-content:center">
              <span class="badge badge-primary" style="width:fit-content;margin-bottom:12px">
                {{ filteredArticles()[0].category | titlecase }}
              </span>
              <h2 style="font-size:18px;font-weight:700;line-height:1.4;margin-bottom:12px">
                {{ filteredArticles()[0].headline }}
              </h2>
              <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:20px">
                {{ filteredArticles()[0].summary | slice:0:160 }}…
              </p>
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:12px;font-weight:600;color:var(--primary)">{{ filteredArticles()[0].source }}</span>
                <span style="font-size:11px;color:var(--text-muted)">{{ filteredArticles()[0].datetime | date:'MMM d, h:mm a' }}</span>
              </div>
              <a href="#" target="_blank" class="btn-primary" style="margin-top:16px;width:fit-content;text-decoration:none">
                Read Article <span class="material-icons" style="font-size:16px">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      }

      <!-- News Grid -->
      @if (loading()) {
        <div class="news-grid">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="wp-card news-skeleton">
              <div class="skeleton" style="height:180px;border-radius:var(--radius-md);margin-bottom:16px"></div>
              <div class="skeleton skeleton-text" style="width:30%;height:12px"></div>
              <div class="skeleton skeleton-title" style="margin-top:8px;height:18px"></div>
              <div class="skeleton skeleton-text" style="margin-top:8px;width:100%"></div>
              <div class="skeleton skeleton-text" style="width:80%"></div>
            </div>
          }
        </div>
      } @else {
        <div class="news-grid">
          @for (article of filteredArticles().slice(1); track article.id) {
            <div class="news-card wp-card" (click)="openArticle(article)">
              <div class="news-img-wrap">
                <img [src]="article.image" [alt]="article.headline" loading="lazy"
                     (error)="onImgError($event)">
                <div class="news-category-chip">
                  <span class="badge badge-primary" style="font-size:10px">{{ article.category | titlecase }}</span>
                </div>
              </div>
              <div class="news-content">
                <h4 class="news-headline">{{ article.headline }}</h4>
                <p class="news-summary">{{ article.summary | slice:0:100 }}…</p>
                <div class="news-meta">
                  <span class="news-source">{{ article.source }}</span>
                  <span class="news-time">{{ formatTime(article.datetime) }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredArticles().length === 0) {
          <div class="empty-state">
            <span class="material-icons">newspaper</span>
            <p>No articles found for the selected category.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .featured-card {
      @media (max-width: 768px) {
        > div { grid-template-columns: 1fr !important; }
        > div > div:first-child { min-height: 200px !important; }
      }
    }

    .news-card {
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--transition), border-color var(--transition);

      &:hover {
        transform: translateY(-4px);
        border-color: var(--border-medium);
      }
    }

    .news-img-wrap {
      position: relative;
      overflow: hidden;
      height: 180px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 300ms ease;
      }

      &:hover img { transform: scale(1.04); }
    }

    .news-category-chip {
      position: absolute;
      top: 10px;
      left: 10px;
    }

    .news-content { padding: 16px; }

    .news-headline {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.4;
      color: var(--text-primary);
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-summary {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .news-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .news-source { font-size: 12px; font-weight: 600; color: var(--primary); }
    .news-time   { font-size: 11px; color: var(--text-muted); }

    .news-skeleton { padding: 16px; }
  `]
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);

  articles        = signal<NewsArticle[]>([]);
  loading         = signal(true);
  activeCategory  = signal<NewsCategory>('all');
  searchQuery     = '';

  categories: { value: NewsCategory; label: string }[] = [
    { value: 'all',      label: 'All' },
    { value: 'stocks',   label: 'Stocks' },
    { value: 'crypto',   label: 'Crypto' },
    { value: 'economy',  label: 'Economy' },
    { value: 'earnings', label: 'Earnings' },
  ];

  filteredArticles = () => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.articles();
    return this.articles().filter(a => a.headline.toLowerCase().includes(q) || a.source.toLowerCase().includes(q));
  };

  ngOnInit(): void {
    this.setCategory('all');
  }

  setCategory(cat: NewsCategory): void {
    this.activeCategory.set(cat);
    this.loading.set(true);
    this.newsService.getMarketNews(cat).subscribe(articles => {
      this.articles.set(articles);
      this.loading.set(false);
    });
  }

  openArticle(article: NewsArticle): void {
    window.open(article.url === '#' ? undefined : article.url, '_blank');
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400';
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
