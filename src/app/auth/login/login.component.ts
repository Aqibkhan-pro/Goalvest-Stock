import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-root">

      <!-- ── Left panel ─────────────────────────────────────────────── -->
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
          <div class="stat-pill"><span class="material-icons">trending_up</span><span>S&amp;P 500 up +24.3% YTD</span></div>
          <div class="stat-pill"><span class="material-icons">currency_bitcoin</span><span>BTC $67,420</span></div>
        </div>
      </div>

      <!-- ── Right panel ────────────────────────────────────────────── -->
      <div class="login-right">
        <div class="login-card">

          <!-- Mode switcher -->
          <div class="auth-switcher">
            <button class="auth-tab" [class.active]="mode() === 'login'"  (click)="switchMode('login')">
              <span class="material-icons">login</span>
              Sign In
            </button>
            <button class="auth-tab" [class.active]="mode() === 'signup'" (click)="switchMode('signup')">
              <span class="material-icons">person_add</span>
              Sign Up
            </button>
          </div>

          @if (mode() === 'login') {
            <!-- ── SIGN IN ── -->
            <div class="login-header">
              <h2>Welcome back</h2>
              <p>Sign in to your Goalvest Stock account</p>
            </div>

            <form (ngSubmit)="login()" #loginForm="ngForm" class="login-form">
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" [(ngModel)]="loginEmail" name="email"
                         class="wp-input has-icon" placeholder="you@example.com"
                         required autocomplete="email">
                </div>
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">lock</span>
                  <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="loginPassword" name="password"
                         class="wp-input has-icon has-suffix" placeholder="••••••••"
                         required autocomplete="current-password">
                  <button type="button" class="pwd-toggle" (click)="showPwd.set(!showPwd())">
                    <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              @if (error()) {
                <div class="error-msg">
                  <span class="material-icons">error_outline</span>{{ error() }}
                </div>
              }

              <button type="submit" class="btn-primary login-btn" [disabled]="loading()">
                @if (loading()) {
                  <span class="material-icons spin">refresh</span> Signing in...
                } @else {
                  Sign In <span class="material-icons">arrow_forward</span>
                }
              </button>
            </form>

            <p class="switch-hint">
              Don't have an account?
              <button class="link-btn" (click)="switchMode('signup')">Create one →</button>
            </p>

            <div class="demo-hint">
              <span class="material-icons" style="font-size:14px;opacity:0.5">info</span>
              Demo: demo&#64;goalvest.com / Demo&#64;1234
            </div>
          }

          @if (mode() === 'signup') {
            <!-- ── SIGN UP ── -->
            <div class="login-header">
              <h2>Create account</h2>
              <p>Join Goalvest Stock — it's free</p>
            </div>

            <form (ngSubmit)="signup()" #signupForm="ngForm" class="login-form">
              <div class="form-group">
                <label>Full Name</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">person</span>
                  <input type="text" [(ngModel)]="signupName" name="name"
                         class="wp-input has-icon" placeholder="Alex Morgan"
                         required autocomplete="name">
                </div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" [(ngModel)]="signupEmail" name="email"
                         class="wp-input has-icon" placeholder="you@example.com"
                         required autocomplete="email">
                </div>
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">lock</span>
                  <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="signupPassword" name="password"
                         class="wp-input has-icon has-suffix" placeholder="Min. 6 characters"
                         required autocomplete="new-password">
                  <button type="button" class="pwd-toggle" (click)="showPwd.set(!showPwd())">
                    <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Confirm Password</label>
                <div class="input-wrap">
                  <span class="material-icons input-icon">lock_reset</span>
                  <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="signupConfirm" name="confirm"
                         class="wp-input has-icon" placeholder="Re-enter password"
                         required autocomplete="new-password">
                </div>
              </div>

              @if (error()) {
                <div class="error-msg">
                  <span class="material-icons">error_outline</span>{{ error() }}
                </div>
              }
              @if (success()) {
                <div class="success-msg">
                  <span class="material-icons">check_circle</span>{{ success() }}
                </div>
              }

              <button type="submit" class="btn-primary login-btn" [disabled]="loading()">
                @if (loading()) {
                  <span class="material-icons spin">refresh</span> Creating account...
                } @else {
                  Create Account <span class="material-icons">arrow_forward</span>
                }
              </button>
            </form>

            <p class="switch-hint">
              Already have an account?
              <button class="link-btn" (click)="switchMode('login')">Sign in →</button>
            </p>
          }

          <p class="terms">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
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

    /* ── Left panel ── */
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
      @media (max-width: 900px) { padding: 32px 24px; min-height: 280px; }
    }

    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: auto; }
    .brand-icon { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-text  { display: flex; flex-direction: column; gap: 1px; }
    .brand-name  { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; }
    .brand-sub   { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; }

    .hero-content {
      margin: 40px 0;
      h1 { font-size: 32px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 16px; }
      p  { font-size: 15px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 32px; }
      @media (max-width: 900px) { display: none; }
    }

    .features { display: flex; flex-direction: column; gap: 20px; }
    .feature-item { display: flex; align-items: flex-start; gap: 14px; }
    .feature-icon {
      width: 40px; height: 40px;
      background: rgba(59,130,246,0.15);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 20px; color: #60A5FA; }
    }
    .feature-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; }
    .feature-desc  { font-size: 12px; color: rgba(255,255,255,0.5); }

    .left-footer {
      display: flex; gap: 12px; flex-wrap: wrap;
      @media (max-width: 900px) { display: none; }
    }
    .stat-pill {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7);
      .material-icons { font-size: 15px; color: #10B981; }
    }

    /* ── Right panel ── */
    .login-right {
      width: 480px;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 32px;
      @media (max-width: 900px) { width: 100%; padding: 32px 20px; }
    }

    .login-card {
      width: 100%;
      max-width: 380px;
    }

    /* ── Auth switcher ── */
    .auth-switcher {
      display: flex;
      gap: 10px;
      margin-bottom: 28px;
    }

    .auth-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 13px 0;
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 200ms ease;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.2px;

      .material-icons { font-size: 18px; }

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--primary-dim);
      }

      &.active {
        border-color: var(--primary);
        background: var(--primary);
        color: #fff;
        box-shadow: 0 4px 14px rgba(59,130,246,0.35);
      }
    }

    /* ── Header ── */
    .login-header {
      margin-bottom: 24px;
      h2 { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
      p  { font-size: 14px; color: var(--text-muted); }
    }

    /* ── Form ── */
    .login-form { display: flex; flex-direction: column; gap: 18px; }

    .form-group {
      display: flex; flex-direction: column; gap: 6px;
      label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 18px; color: var(--text-muted); pointer-events: none;
    }
    .wp-input {
      width: 100%; padding: 11px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      transition: border-color var(--transition);
      box-sizing: border-box;

      &.has-icon   { padding-left: 42px; }
      &.has-suffix { padding-right: 42px; }
      &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); }
      &::placeholder { color: var(--text-muted); }
    }
    .pwd-toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); display: flex; align-items: center;
      .material-icons { font-size: 18px; }
      &:hover { color: var(--text-primary); }
    }

    /* ── Messages ── */
    .error-msg {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 14px;
      background: var(--danger-dim);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--radius-md);
      font-size: 13px; color: var(--danger);
      .material-icons { font-size: 17px; flex-shrink: 0; }
    }
    .success-msg {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 14px;
      background: var(--success-dim);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: var(--radius-md);
      font-size: 13px; color: var(--success);
      .material-icons { font-size: 17px; flex-shrink: 0; }
    }

    /* ── Submit button ── */
    .login-btn {
      width: 100%; padding: 12px;
      font-size: 15px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 4px;
    }

    /* ── Bottom links ── */
    .switch-hint {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 18px;
    }
    .link-btn {
      background: none; border: none;
      color: var(--primary); font-size: 13px; font-weight: 600;
      cursor: pointer; padding: 0;
      font-family: 'Inter', sans-serif;
      &:hover { text-decoration: underline; }
    }

    .demo-hint {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      margin-top: 12px;
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
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
  mode = signal<AuthMode>('login');

  // Sign in fields
  loginEmail    = '';
  loginPassword = '';

  // Sign up fields
  signupName     = '';
  signupEmail    = '';
  signupPassword = '';
  signupConfirm  = '';

  error   = signal('');
  success = signal('');
  loading = signal(false);
  showPwd = signal(false);

  features = [
    { icon: 'pie_chart',        title: 'Portfolio Tracking',  desc: 'Monitor all your investments in one place' },
    { icon: 'bar_chart',        title: 'Real-Time Markets',   desc: 'Live quotes, charts, and market data' },
    { icon: 'currency_bitcoin', title: 'Crypto Integration',  desc: 'Track 20+ cryptocurrencies seamlessly' },
    { icon: 'newspaper',        title: 'Financial News',      desc: 'Stay informed with curated market news' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  switchMode(m: AuthMode): void {
    this.mode.set(m);
    this.error.set('');
    this.success.set('');
    this.showPwd.set(false);
  }

  async login(): Promise<void> {
    this.error.set('');
    if (!this.loginEmail || !this.loginPassword) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.loginEmail, this.loginPassword);
      this.router.navigate(['/app/dashboard']);
    } catch (e: any) {
      this.error.set(this.firebaseError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async signup(): Promise<void> {
    this.error.set('');
    this.success.set('');
    if (!this.signupName.trim())  { this.error.set('Please enter your full name.'); return; }
    if (!this.signupEmail.trim()) { this.error.set('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.signupEmail)) { this.error.set('Please enter a valid email address.'); return; }
    if (this.signupPassword.length < 6) { this.error.set('Password must be at least 6 characters.'); return; }
    if (this.signupPassword !== this.signupConfirm) { this.error.set('Passwords do not match.'); return; }

    this.loading.set(true);
    try {
      await this.auth.register(this.signupName.trim(), this.signupEmail.trim(), this.signupPassword);
      this.router.navigate(['/app/dashboard']);
    } catch (e: any) {
      this.error.set(this.firebaseError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private firebaseError(code: string): string {
    const map: Record<string, string> = {
      'auth/invalid-email':            'Invalid email address.',
      'auth/user-not-found':           'No account found with this email.',
      'auth/wrong-password':           'Incorrect password.',
      'auth/invalid-credential':       'Invalid email or password.',
      'auth/email-already-in-use':     'This email is already registered.',
      'auth/weak-password':            'Password must be at least 6 characters.',
      'auth/too-many-requests':        'Too many attempts. Please try again later.',
      'auth/network-request-failed':   'Network error. Check your connection.',
      'auth/user-disabled':            'This account has been disabled.',
    };
    return map[code] ?? 'Something went wrong. Please try again.';
  }
}
