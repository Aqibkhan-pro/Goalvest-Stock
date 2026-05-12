import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-root">
      <!-- Left panel -->
      <div class="login-left">
        <div class="brand">
          <div class="brand-icon">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ln_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#2563EB"/>
                  <stop offset="100%" stop-color="#6D28D9"/>
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="14" fill="url(#ln_bg)"/>
              <rect x="9"  y="42" width="10" height="14" rx="2.5" fill="white" fill-opacity="0.45"/>
              <rect x="23" y="33" width="10" height="23" rx="2.5" fill="white" fill-opacity="0.7"/>
              <rect x="37" y="22" width="10" height="34" rx="2.5" fill="white"/>
              <path d="M11 41 L28 32 L42 21 L53 13" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="53" cy="13" r="6.5" stroke="#FBBF24" stroke-width="2" fill="rgba(251,191,36,0.18)"/>
              <circle cx="53" cy="13" r="2.5" fill="#FBBF24"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Goalvest</span>
            <span class="brand-sub">Stock</span>
          </div>
        </div>
        <div class="hero-content">
          <h1>Smart Stock Investment Platform</h1>
          <p>Track your portfolio, monitor markets, and make smarter investment decisions — all in one powerful platform.</p>
          <div class="features">
            @for (f of features; track f.icon) {
              <div class="feature-item">
                <div class="feature-icon"><span class="material-icons">{{ f.icon }}</span></div>
                <div>
                  <p class="feature-title">{{ f.title }}</p>
                  <p class="feature-desc">{{ f.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="left-footer">
          <div class="stat-pill">
            <span class="material-icons">trending_up</span>
            <span>S&amp;P 500 up +24.3% YTD</span>
          </div>
          <div class="stat-pill">
            <span class="material-icons">currency_bitcoin</span>
            <span>BTC $67,420</span>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Goalvest Stock account</p>
          </div>

          <div class="demo-badge">
            <span class="material-icons">info</span>
            <div>
              <strong>Demo Account</strong>
              <span>demo&#64;goalvest.com / Demo&#64;1234</span>
            </div>
          </div>

          <form (ngSubmit)="login()" #form="ngForm" class="login-form">
            <div class="form-group">
              <label>Email Address</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">email</span>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  class="wp-input has-icon"
                  placeholder="demo@goalvest.com"
                  required
                  autocomplete="email">
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrap">
                <span class="material-icons input-icon">lock</span>
                <input
                  [type]="showPwd() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  class="wp-input has-icon has-suffix"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password">
                <button type="button" class="pwd-toggle" (click)="showPwd.set(!showPwd())">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="error-msg">
                <span class="material-icons">error_outline</span>
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary login-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="material-icons spin">refresh</span>
                Signing in...
              } @else {
                Sign in
                <span class="material-icons">arrow_forward</span>
              }
            </button>
          </form>

          <p class="terms">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-root {
      min-height: 100vh;
      display: flex;

      @media (max-width: 900px) { flex-direction: column; }
    }

    // Left panel
    .login-left {
      flex: 1;
      background: linear-gradient(135deg, #0A0E1A 0%, #1a1035 100%);
      padding: 40px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -100px; left: -100px;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
        pointer-events: none;
      }

      @media (max-width: 900px) { padding: 32px 24px; min-height: 320px; }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: auto;
    }

    .brand-icon {
      width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex; flex-direction: column; gap: 1px;
    }

    .brand-name { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; }
    .brand-sub  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; }

    .hero-content {
      margin: 40px 0;

      h1 { font-size: 32px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 16px; }
      p  { font-size: 15px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 32px; }
    }

    .features { display: flex; flex-direction: column; gap: 20px; }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .feature-icon {
      width: 40px; height: 40px;
      background: var(--primary-dim);
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 20px; color: var(--primary); }
    }

    .feature-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; }
    .feature-desc  { font-size: 12px; color: rgba(255,255,255,0.5); }

    .left-footer {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      .material-icons { font-size: 14px; color: var(--success); }
    }

    // Right panel
    .login-right {
      width: 480px;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;

      @media (max-width: 900px) { width: 100%; padding: 32px 24px; }
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      animation: fade-in-up 0.4s ease;
    }

    .login-header {
      margin-bottom: 28px;
      h2 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
      p  { color: var(--text-secondary); font-size: 14px; }
    }

    .demo-badge {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px 14px;
      background: var(--primary-dim);
      border: 1px solid rgba(59,130,246,0.25);
      border-radius: var(--radius-md);
      margin-bottom: 24px;

      .material-icons { font-size: 18px; color: var(--primary); flex-shrink: 0; margin-top: 1px; }
      strong { display: block; font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 2px; }
      span   { font-size: 12px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 17px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .wp-input.has-icon { padding-left: 40px; }
    .wp-input.has-suffix { padding-right: 40px; }

    .pwd-toggle {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      .material-icons { font-size: 17px; }
      &:hover { color: var(--text-secondary); }
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--danger-dim);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--radius-sm);
      color: var(--danger);
      font-size: 13px;

      .material-icons { font-size: 17px; }
    }

    .login-btn {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 14px;
      margin-top: 4px;
    }

    .terms {
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 20px;
      line-height: 1.5;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `]
})
export class LoginComponent {
  email    = 'demo@goalvest.com';
  password = 'Demo@1234';
  error    = signal('');
  loading  = signal(false);
  showPwd  = signal(false);

  features = [
    { icon: 'pie_chart',       title: 'Portfolio Tracking',    desc: 'Monitor all your investments in one place' },
    { icon: 'bar_chart',       title: 'Real-Time Markets',     desc: 'Live quotes, charts, and market data' },
    { icon: 'currency_bitcoin', title: 'Crypto Integration',   desc: 'Track 20+ cryptocurrencies seamlessly' },
    { icon: 'newspaper',       title: 'Financial News',        desc: 'Stay informed with curated market news' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    this.error.set('');
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      const ok = this.auth.login(this.email, this.password);
      this.loading.set(false);
      if (ok) {
        this.router.navigate(['/app/dashboard']);
      } else {
        this.error.set('Invalid email or password. Try demo@goalvest.com / Demo@1234');
      }
    }, 800);
  }
}
