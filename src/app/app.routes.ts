import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'app/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Goalvest Stock — Sign In'
  },
  {
    path: 'app',
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Goalvest Stock — Dashboard'
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent),
        title: 'Goalvest Stock — Portfolio'
      },
      {
        path: 'markets',
        loadComponent: () => import('./features/markets/markets.component').then(m => m.MarketsComponent),
        title: 'Goalvest Stock — Markets'
      },
      {
        path: 'crypto',
        loadComponent: () => import('./features/crypto/crypto.component').then(m => m.CryptoComponent),
        title: 'Goalvest Stock — Crypto'
      },
      {
        path: 'news',
        loadComponent: () => import('./features/news/news.component').then(m => m.NewsComponent),
        title: 'Goalvest Stock — News'
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Goalvest Stock — Settings'
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'app/dashboard'
  }
];
