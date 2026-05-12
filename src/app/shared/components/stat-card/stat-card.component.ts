import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { PercentChangePipe } from '../../pipes/percent-change.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyFormatPipe, PercentChangePipe],
  template: `
    <div class="stat-card" [class.loading]="loading" style="height: stretch;">
      <div class="stat-icon" [style.background]="iconBg">
        <span class="material-icons">{{ icon }}</span>
      </div>
      <div class="stat-content">
        <p class="stat-label">{{ label }}</p>
        @if (loading) {
          <div class="skeleton skeleton-value" style="height:28px;width:120px;margin-top:4px"></div>
          <div class="skeleton skeleton-text" style="width:80px;margin-top:8px"></div>
        } @else {
          <h2 class="stat-value mono">
            @if (isCurrency) { {{ numericValue | currencyFormat }}  }
            @else if (isPercent) { {{ numericValue | percentChange }}  }
            @else { {{ value }}  }
          </h2>
          @if (change != null) {
            <p class="stat-change" [class.change-positive]="change >= 0" [class.change-negative]="change < 0">
              <span class="material-icons">{{ change >= 0 ? 'arrow_upward' : 'arrow_downward' }}</span>
              {{ change | percentChange }} today
            </p>
          }
          @if (subtitle) {
            <p class="stat-subtitle">{{ subtitle }}</p>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
      animation: fade-in-up 0.3s ease forwards;

      &:hover { border-color: var(--border-medium); transform: translateY(-2px); }
    }

    .stat-icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;

      .material-icons { font-size: 22px; color: #fff; }
    }

    .stat-content { flex: 1; min-width: 0; }

    .stat-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-change {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 500;
      margin-top: 6px;

      .material-icons { font-size: 14px; }
    }

    .stat-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() change: number | null = null;
  @Input() subtitle = '';
  @Input() icon = 'trending_up';
  @Input() iconBg = 'var(--primary)';
  @Input() isCurrency = false;
  @Input() isPercent  = false;
  @Input() loading    = false;

  get numericValue(): number | null {
    return typeof this.value === 'number' ? this.value : null;
  }
}
