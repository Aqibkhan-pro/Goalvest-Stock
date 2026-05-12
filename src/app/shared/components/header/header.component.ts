import { Component, Output, EventEmitter, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService }    from '../../../core/services/auth.service';
import { ThemeService }  from '../../../core/services/theme.service';
import { RealTimeService } from '../../../core/services/realtime.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-header">
      <!-- Mobile menu button -->
      <button class="mobile-menu-btn" (click)="menuToggle.emit()">
        <span class="material-icons">menu</span>
      </button>

      <!-- Page title -->
      <div class="header-title">
        <div class="breadcrumb">Goalvest Stock</div>
      </div>

      <!-- Live / Simulated badge -->
      <div class="data-mode-badge"
           [class.live]="rt.mode() === 'live'"
           [class.sim]="rt.mode() === 'simulated'"
           [title]="rt.mode() === 'live' ? 'Connected to Finnhub WebSocket' : 'Simulated data — add a Finnhub API key for live data'">
        <span class="pulse-dot" [class.green]="rt.mode()==='live'" [class.yellow]="rt.mode()==='simulated'"></span>
        {{ rt.mode() === 'live' ? 'Live Data' : 'Simulated' }}
      </div>

      <div class="header-actions">

        <!-- Theme Toggle -->
        <button class="action-btn theme-toggle"
                (click)="theme.toggle()"
                [title]="theme.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <span class="material-icons theme-icon">
            {{ theme.isDark() ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>

        <!-- Notifications -->
        <button class="action-btn notif-btn" (click)="showNotifs.set(!showNotifs())" title="Notifications">
          <span class="material-icons">notifications</span>
          <span class="notif-badge">3</span>
        </button>

        <!-- Notifications Dropdown -->
        @if (showNotifs()) {
          <div class="notif-dropdown" (click)="$event.stopPropagation()">
            <div class="notif-header">
              <span>Notifications</span>
              <button (click)="showNotifs.set(false)"><span class="material-icons">close</span></button>
            </div>
            @for (n of notifications; track n.id) {
              <div class="notif-item" [class.unread]="!n.read">
                <div class="notif-dot"
                     [class.dot-success]="n.type==='success'"
                     [class.dot-info]="n.type==='info'"
                     [class.dot-warning]="n.type==='warning'">
                </div>
                <div class="notif-content">
                  <p class="notif-text">{{ n.text }}</p>
                  <p class="notif-time">{{ n.time }}</p>
                </div>
              </div>
            }
          </div>
        }

        <!-- Divider -->
        <div class="header-divider"></div>

        <!-- User -->
        <div class="user-profile" (click)="showMenu.set(!showMenu())">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser()?.name }}</span>
            <span class="user-role">Pro Account</span>
          </div>
          <span class="material-icons chevron">expand_more</span>
        </div>

        @if (showMenu()) {
          <div class="user-menu">
            <a routerLink="/app/settings" class="menu-item" (click)="showMenu.set(false)">
              <span class="material-icons">person</span> Profile
            </a>
            <a routerLink="/app/settings" class="menu-item" (click)="showMenu.set(false)">
              <span class="material-icons">settings</span> Settings
            </a>
            <div class="menu-divider"></div>
            <button class="menu-item" (click)="theme.toggle(); showMenu.set(false)">
              <span class="material-icons">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
              {{ theme.isDark() ? 'Light Mode' : 'Dark Mode' }}
            </button>
            <div class="menu-divider"></div>
            <button class="menu-item danger" (click)="auth.logout()">
              <span class="material-icons">logout</span> Sign Out
            </button>
          </div>
        }
      </div>
    </header>

    <!-- Overlay to close dropdowns -->
    @if (showNotifs() || showMenu()) {
      <div class="overlay" (click)="closeAll()"></div>
    }
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .mobile-menu-btn {
      display: none;
      width: 36px; height: 36px;
      align-items: center; justify-content: center;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition);

      .material-icons { font-size: 20px; }
      &:hover { background: var(--bg-card); color: var(--text-primary); }
      @media (max-width: 768px) { display: flex; }
    }

    .header-title { flex: 1; }
    .breadcrumb { font-size: 14px; font-weight: 600; color: var(--text-secondary); }

    .data-mode-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
      cursor: default;
      transition: all var(--transition);

      &.live { background: var(--success-dim); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
      &.sim  { background: var(--gold-dim);    color: var(--gold);    border: 1px solid rgba(245,158,11,0.2); }

      @media (max-width: 640px) { display: none; }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .action-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition);

      .material-icons { font-size: 18px; }
      &:hover { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-medium); }
    }

    // Theme toggle glow effect
    .theme-toggle {
      &:hover {
        border-color: var(--gold);
        color: var(--gold);
        box-shadow: 0 0 12px var(--gold-dim);
      }
      .theme-icon { transition: transform 400ms ease; }
      &:hover .theme-icon { transform: rotate(20deg) scale(1.1); }
    }

    .notif-btn { position: relative; }
    .notif-badge {
      position: absolute;
      top: -4px; right: -4px;
      width: 16px; height: 16px;
      background: var(--danger);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }

    .header-divider {
      width: 1px; height: 28px;
      background: var(--border-subtle);
      margin: 0 4px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition);
      &:hover { background: var(--bg-card); }
    }

    .user-avatar {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, var(--primary), #7C3AED);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }

    .user-info { @media (max-width: 640px) { display: none; } }
    .user-name { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .user-role { display: block; font-size: 11px; color: var(--primary); font-weight: 500; }
    .chevron   { font-size: 18px; color: var(--text-muted); }

    // Notifications dropdown
    .notif-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 80px;
      width: 320px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      z-index: 200;
      overflow: hidden;
      animation: fade-in-up 0.2s ease;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);

      button {
        background: none; border: none;
        color: var(--text-muted); cursor: pointer;
        display: flex; align-items: center;
        .material-icons { font-size: 18px; }
      }
    }

    .notif-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      transition: background var(--transition);

      &:hover   { background: var(--bg-card-hover); }
      &.unread  { background: var(--primary-dim); }
      &:last-child { border-bottom: none; }
    }

    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0; margin-top: 4px;
      &.dot-success { background: var(--success); }
      &.dot-info    { background: var(--primary); }
      &.dot-warning { background: var(--gold); }
    }

    .notif-content { flex: 1; }
    .notif-text { font-size: 13px; color: var(--text-primary); line-height: 1.4; }
    .notif-time { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

    // User dropdown menu
    .user-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 210px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      z-index: 200;
      overflow: hidden;
      padding: 6px;
      animation: fade-in-up 0.2s ease;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      font-family: 'Inter', sans-serif;
      transition: all var(--transition);
      text-align: left;

      .material-icons { font-size: 17px; }
      &:hover { background: var(--bg-card-hover); color: var(--text-primary); }
      &.danger:hover { background: var(--danger-dim); color: var(--danger); }
    }

    .menu-divider { height: 1px; background: var(--border-subtle); margin: 4px 0; }

    .overlay { position: fixed; inset: 0; z-index: 80; }
  `]
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();
  readonly showNotifs = signal(false);
  readonly showMenu   = signal(false);
  readonly auth  = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly rt    = inject(RealTimeService);

  notifications = [
    { id: 1, text: 'AAPL up 2.5% — approaching your target price', time: '2 min ago',  type: 'success', read: false },
    { id: 2, text: 'Bitcoin crossed $68,000 resistance level',      time: '15 min ago', type: 'info',    read: false },
    { id: 3, text: 'Portfolio hit all-time high of $142,500',       time: '1 hour ago', type: 'success', read: false },
  ];

  initials(): string {
    const name = this.auth.currentUser()?.name ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  closeAll(): void {
    this.showNotifs.set(false);
    this.showMenu.set(false);
  }
}
