import { Component, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent }    from '../shared/components/sidebar/sidebar.component';
import { HeaderComponent }     from '../shared/components/header/header.component';
import { PriceTickerComponent } from '../shared/components/price-ticker/price-ticker.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, PriceTickerComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        (toggle)="sidebarCollapsed.set(!sidebarCollapsed())">
      </app-sidebar>

      <!-- Mobile overlay -->
      @if (!sidebarCollapsed() && isMobile()) {
        <div class="mobile-overlay" (click)="sidebarCollapsed.set(true)"></div>
      }

      <!-- Main content -->
      <div class="shell-main">
        <app-price-ticker></app-price-ticker>
        <app-header (menuToggle)="toggleMobileSidebar()"></app-header>

        <main class="shell-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-base);
    }

    app-sidebar {
      flex-shrink: 0;
      transition: width 250ms ease;

      @media (max-width: 768px) {
        position: fixed;
        left: 0; top: 0;
        height: 100%;
        z-index: 200;
        transform: translateX(0);
        transition: transform 250ms ease;
      }
    }

    .shell.sidebar-collapsed app-sidebar {
      @media (max-width: 768px) {
        transform: translateX(-100%);
      }
    }

    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 150;
      backdrop-filter: blur(2px);
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .shell-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
  isMobile = signal(false);

  constructor() {
    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile.set(window.innerWidth <= 768);
    if (this.isMobile()) this.sidebarCollapsed.set(true);
  }

  toggleMobileSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }
}
