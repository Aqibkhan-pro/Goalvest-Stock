import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light' | 'system';

const THEME_KEY = 'wp_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly theme  = signal<Theme>('dark');
  readonly isDark = signal<boolean>(true);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = (localStorage.getItem(THEME_KEY) ?? 'dark') as Theme;
    this._apply(saved);

    // React to OS preference changes when in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme() === 'system') this._apply('system');
    });
  }

  setTheme(t: Theme): void {
    localStorage.setItem(THEME_KEY, t);
    this._apply(t);
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private _apply(t: Theme): void {
    this.theme.set(t);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = t === 'system' ? prefersDark : t === 'dark';
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
