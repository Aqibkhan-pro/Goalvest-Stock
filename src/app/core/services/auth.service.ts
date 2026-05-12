import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, updateProfile, onAuthStateChanged, User } from '@angular/fire/auth';

export interface AuthUser {
  email: string;
  name: string;
  uid: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth   = inject(Auth);
  private router = inject(Router);

  readonly isAuthenticated = signal(false);
  readonly currentUser     = signal<AuthUser | null>(null);
  readonly authLoading     = signal(true);

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        this.isAuthenticated.set(true);
        this.currentUser.set({
          uid:   user.uid,
          email: user.email ?? '',
          name:  user.displayName ?? user.email?.split('@')[0] ?? 'User',
        });
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
      }
      this.authLoading.set(false);
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // update signal immediately so header shows correct name
    this.currentUser.set({ uid: cred.user.uid, email, name });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
