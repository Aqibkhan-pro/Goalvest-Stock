import {
  Component, signal, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService }          from '../../core/services/auth.service';
import { ThemeService, Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div class="page-title">
          <h1>Settings</h1>
          <p>Manage your account, preferences, and notifications</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:24px" class="settings-layout">

        <!-- Settings Nav -->
        <div class="wp-card settings-nav">
          @for (s of sections; track s.id) {
            <button class="settings-nav-item" [class.active]="activeSection() === s.id" (click)="activeSection.set(s.id)">
              <span class="material-icons">{{ s.icon }}</span>
              {{ s.label }}
            </button>
          }
        </div>

        <!-- Content -->
        <div>

          <!-- Profile -->
          @if (activeSection() === 'profile') {
            <div class="settings-section fade-in-up">
              <div class="wp-card">
                <h3 class="section-title">Profile Information</h3>
                <div class="avatar-row">
                  <div class="big-avatar">{{ initials() }}</div>
                  <div>
                    <h4>{{ auth.currentUser()?.name }}</h4>
                    <p style="color:var(--text-muted);font-size:13px">{{ auth.currentUser()?.email }}</p>
                    <button class="btn-ghost" style="margin-top:8px;font-size:12px">Change Avatar</button>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="modal-grid">
                  <div class="form-group">
                    <label>Full Name</label>
                    <input class="wp-input" [value]="auth.currentUser()?.name" placeholder="Your name">
                  </div>
                  <div class="form-group">
                    <label>Email Address</label>
                    <input class="wp-input" [value]="auth.currentUser()?.email" type="email" disabled style="opacity:0.6">
                  </div>
                  <div class="form-group">
                    <label>Phone Number</label>
                    <input class="wp-input" placeholder="+1 (555) 000-0000">
                  </div>
                  <div class="form-group">
                    <label>Country</label>
                    <select class="wp-input">
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Pakistan</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </select>
                  </div>
                </div>
                <div style="margin-top:20px">
                  <button class="btn-primary" (click)="save('Profile updated')">Save Changes</button>
                </div>
              </div>
            </div>
          }

          <!-- Appearance -->
          @if (activeSection() === 'appearance') {
            <div class="settings-section fade-in-up">
              <div class="wp-card">
                <h3 class="section-title">Appearance</h3>
                <div class="setting-row">
                  <div>
                    <p class="setting-label">Theme</p>
                    <p class="setting-desc">Choose your preferred color scheme</p>
                  </div>
                  <div style="display:flex;gap:8px">
                    @for (t of themeOptions; track t.value) {
                      <button class="theme-btn"
                              [class.active]="themeService.theme() === t.value"
                              (click)="themeService.setTheme(t.value)">
                        <span class="material-icons">{{ t.icon }}</span>
                        {{ t.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="divider"></div>
                <div class="setting-row">
                  <div>
                    <p class="setting-label">Currency</p>
                    <p class="setting-desc">Default currency for displaying monetary values</p>
                  </div>
                  <select class="wp-input" style="width:140px" [(ngModel)]="currency">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PKR">PKR (₨)</option>
                  </select>
                </div>
                <div class="divider"></div>
                <div class="setting-row">
                  <div>
                    <p class="setting-label">Compact Numbers</p>
                    <p class="setting-desc">Show large numbers in compact format (1.2M, 4.5B)</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="compactNumbers">
                    <span class="toggle-track"></span>
                  </label>
                </div>
                <div style="margin-top:20px">
                  <button class="btn-primary" (click)="save('Appearance settings saved')">Save Changes</button>
                </div>
              </div>
            </div>
          }

          <!-- Notifications -->
          @if (activeSection() === 'notifications') {
            <div class="settings-section fade-in-up">
              <div class="wp-card">
                <h3 class="section-title">Notification Preferences</h3>
                @for (n of notifSettings; track n.id) {
                  <div class="setting-row">
                    <div>
                      <p class="setting-label">{{ n.label }}</p>
                      <p class="setting-desc">{{ n.desc }}</p>
                    </div>
                    <label class="toggle">
                      <input type="checkbox" [(ngModel)]="n.enabled">
                      <span class="toggle-track"></span>
                    </label>
                  </div>
                  <div class="divider"></div>
                }
                <div style="margin-top:8px">
                  <button class="btn-primary" (click)="save('Notification preferences saved')">Save Changes</button>
                </div>
              </div>
            </div>
          }

          <!-- Security -->
          @if (activeSection() === 'security') {
            <div class="settings-section fade-in-up">
              <div class="wp-card">
                <h3 class="section-title">Security Settings</h3>
                <div class="setting-row">
                  <div>
                    <p class="setting-label">Two-Factor Authentication</p>
                    <p class="setting-desc">Add an extra layer of security to your account</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="twoFactor">
                    <span class="toggle-track"></span>
                  </label>
                </div>
                <div class="divider"></div>
                <div class="setting-row">
                  <div>
                    <p class="setting-label">Session Timeout</p>
                    <p class="setting-desc">Automatically sign out after inactivity</p>
                  </div>
                  <select class="wp-input" style="width:160px">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </div>
                <div class="divider"></div>
                <div>
                  <h4 style="font-size:14px;font-weight:600;margin-bottom:16px">Change Password</h4>
                  <div class="modal-grid">
                    <div class="form-group" style="grid-column:1/-1">
                      <label>Current Password</label>
                      <input type="password" class="wp-input" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                      <label>New Password</label>
                      <input type="password" class="wp-input" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                      <label>Confirm Password</label>
                      <input type="password" class="wp-input" placeholder="••••••••">
                    </div>
                  </div>
                  <button class="btn-primary" style="margin-top:16px" (click)="save('Password updated')">Update Password</button>
                </div>
              </div>

              <div class="wp-card" style="margin-top:20px;border-color:var(--danger-dim)">
                <h3 class="section-title" style="color:var(--danger)">Danger Zone</h3>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                  <div>
                    <p class="setting-label">Sign Out All Devices</p>
                    <p class="setting-desc">This will sign you out from all active sessions</p>
                  </div>
                  <button class="btn-danger" style="font-size:12px;padding:7px 16px" (click)="auth.logout()">Sign Out All</button>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-layout { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }

    .settings-nav {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      height: fit-content;
      position: sticky;
      top: calc(var(--header-height) + var(--ticker-height) + 24px);
    }

    .settings-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all var(--transition);
      text-align: left;

      .material-icons { font-size: 18px; }
      &:hover  { background: var(--bg-card-hover); color: var(--text-primary); }
      &.active { background: var(--primary-dim); color: var(--primary); }
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .avatar-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .big-avatar {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #7C3AED);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; color: #fff;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 10px 0;
      flex-wrap: wrap;
    }

    .setting-label { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
    .setting-desc  { font-size: 12px; color: var(--text-muted); }

    .theme-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all var(--transition);

      .material-icons { font-size: 17px; }
      &.active { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }
      &:hover:not(.active) { background: var(--bg-card); color: var(--text-primary); }
    }

    // Toggle switch
    .toggle {
      position: relative;
      display: flex;
      align-items: center;
      cursor: pointer;
      flex-shrink: 0;

      input { opacity: 0; width: 0; height: 0; position: absolute; }

      .toggle-track {
        width: 44px; height: 24px;
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: 12px;
        position: relative;
        transition: all 250ms ease;

        &::after {
          content: '';
          position: absolute;
          top: 3px; left: 3px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: all 250ms ease;
        }
      }

      input:checked + .toggle-track {
        background: var(--primary);
        border-color: var(--primary);

        &::after { left: 23px; background: #fff; }
      }
    }

    .settings-section { display: flex; flex-direction: column; gap: 0; }
  `]
})
export class SettingsComponent {
  auth         = inject(AuthService);
  themeService = inject(ThemeService);
  private snack = inject(MatSnackBar);

  activeSection = signal('profile');
  currentTheme  = signal('dark');
  currency      = 'USD';
  compactNumbers = true;
  twoFactor     = false;

  sections = [
    { id: 'profile',       label: 'Profile',       icon: 'person' },
    { id: 'appearance',    label: 'Appearance',     icon: 'palette' },
    { id: 'notifications', label: 'Notifications',  icon: 'notifications' },
    { id: 'security',      label: 'Security',       icon: 'security' },
  ];

  readonly themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark',   label: 'Dark',   icon: 'dark_mode' },
    { value: 'light',  label: 'Light',  icon: 'light_mode' },
    { value: 'system', label: 'System', icon: 'settings_brightness' },
  ];

  notifSettings = [
    { id: 'price_alerts',    label: 'Price Alerts',          desc: 'When a stock reaches your target price',           enabled: true  },
    { id: 'portfolio_daily', label: 'Daily Summary',         desc: 'Daily portfolio performance email at market close', enabled: true  },
    { id: 'earnings',        label: 'Earnings Reports',      desc: 'Notify when held stocks release earnings',          enabled: false },
    { id: 'market_open',     label: 'Market Open/Close',     desc: 'Alert when US market opens and closes',             enabled: false },
    { id: 'news_digest',     label: 'News Digest',           desc: 'Morning summary of relevant financial news',        enabled: true  },
  ];

  initials(): string {
    const name = this.auth.currentUser()?.name ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  save(msg: string): void {
    this.snack.open(msg, '✓', { duration: 3000 });
  }
}
