import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const DEMO_EMAIL    = 'demo@goalvest.com';
const DEMO_PASSWORD = 'Demo@1234';
const AUTH_KEY      = 'wp_auth';

export interface AuthUser {
  email: string;
  name: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly currentUser     = signal<AuthUser | null>(null);

  constructor(private router: Router) {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const user = JSON.parse(stored) as AuthUser;
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    }
  }

  login(email: string, password: string): boolean {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const user: AuthUser = { email, name: 'Alex Morgan', avatar: '' };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
