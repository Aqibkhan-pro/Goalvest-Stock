import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sb_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#2563EB"/>
                <stop offset="100%" stop-color="#6D28D9"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="url(#sb_bg)"/>
            <rect x="9"  y="42" width="10" height="14" rx="2.5" fill="white" fill-opacity="0.45"/>
            <rect x="23" y="33" width="10" height="23" rx="2.5" fill="white" fill-opacity="0.7"/>
            <rect x="37" y="22" width="10" height="34" rx="2.5" fill="white"/>
            <path d="M11 41 L28 32 L42 21 L53 13" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="53" cy="13" r="6.5" stroke="#FBBF24" stroke-width="2" fill="rgba(251,191,36,0.18)"/>
            <circle cx="53" cy="13" r="2.5" fill="#FBBF24"/>
          </svg>
        </div>
        @if (!collapsed) {
          <div class="logo-text">
            <span class="logo-name">Goalvest</span>
            <span class="logo-tag">Stock</span>
          </div>
        }
        <button class="collapse-btn" (click)="toggle.emit()">
          <span class="material-icons">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        @if (!collapsed) { <p class="nav-section-label">MAIN</p> }
        @for (item of navItems; track item.route) {
          <a class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.route === '/app/dashboard' }"
             [title]="collapsed ? item.label : ''">
            <span class="material-icons nav-icon">{{ item.icon }}</span>
            @if (!collapsed) {
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            }
          </a>
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        @if (!collapsed) {
          <div class="market-status">
            <span class="pulse-dot" [class.green]="marketOpen" [class.red]="!marketOpen"></span>
            <span class="status-text">Market {{ marketOpen ? 'Open' : 'Closed' }}</span>
          </div>
        }
        <button class="logout-btn" (click)="authService.logout()" [title]="collapsed ? 'Logout' : ''">
          <span class="material-icons">logout</span>
          @if (!collapsed) { <span>Logout</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      transition: width 250ms ease;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      z-index: 100;
    }

    .sidebar.collapsed {
      width: 64px;
    }

    // Logo
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 16px;
      border-bottom: 1px solid var(--border-subtle);
      min-height: var(--header-height);
    }

    .logo-icon {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;

      svg { display: block; border-radius: 8px; }
    }

    .logo-text { flex: 1; overflow: hidden; }
    .logo-name { display: block; font-size: 15px; font-weight: 800; color: var(--text-primary); white-space: nowrap; }
    .logo-tag  { display: block; font-size: 9px; font-weight: 700; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 1px; }

    .collapse-btn {
      margin-left: auto;
      width: 28px; height: 28px;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
      transition: all var(--transition);
      flex-shrink: 0;

      .material-icons { font-size: 16px; }
      &:hover { background: var(--bg-card); color: var(--text-primary); }
    }

    // Nav
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      color: var(--text-disabled);
      padding: 8px 8px 4px;
      white-space: nowrap;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition);
      white-space: nowrap;
      position: relative;
      cursor: pointer;

      .nav-icon { font-size: 20px; flex-shrink: 0; }
      .nav-label { font-size: 13px; font-weight: 500; }
      .nav-badge {
        margin-left: auto;
        background: var(--primary);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 10px;
      }

      &:hover {
        background: var(--bg-card);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-dim);
        color: var(--primary);

        .nav-icon { color: var(--primary); }
        .nav-label { color: var(--primary); font-weight: 600; }

        &::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: var(--primary);
          border-radius: 0 2px 2px 0;
        }
      }
    }

    // Footer
    .sidebar-footer {
      padding: 12px 8px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .market-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: var(--bg-card);
      border-radius: var(--radius-md);

      .status-text { font-size: 12px; color: var(--text-secondary); }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 10px;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      transition: all var(--transition);
      width: 100%;

      .material-icons { font-size: 20px; }
      &:hover { background: var(--danger-dim); color: var(--danger); }
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  marketOpen = this.isMarketOpen();

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',       route: '/app/dashboard' },
    { label: 'Portfolio',  icon: 'account_balance_wallet', route: '/app/portfolio' },
    { label: 'Markets',    icon: 'bar_chart',        route: '/app/markets' },
    { label: 'Crypto',     icon: 'currency_bitcoin', route: '/app/crypto' },
    { label: 'News',       icon: 'newspaper',        route: '/app/news' },
    { label: 'Settings',   icon: 'settings',         route: '/app/settings' },
  ];

  constructor(public authService: AuthService) {}

  private isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay();
    const h = now.getHours();
    const m = now.getMinutes();
    const est = h * 60 + m - (new Date().getTimezoneOffset() + 300);
    return day >= 1 && day <= 5 && est >= 570 && est < 960;
  }
}
