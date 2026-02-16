import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <h2 class="page-title">{{ getPageTitle() }}</h2>
      </div>
      <div class="navbar-right">
        @if (authService.isAuthenticated()) {
          <div class="user-menu">
            <div class="user-avatar">
              {{ getUserInitial() }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ authService.user()?.username || authService.user()?.email }}</span>
              <span class="user-email">{{ authService.user()?.email }}</span>
            </div>
            <button class="logout-btn" (click)="handleLogout()" title="Logout">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(12, 12, 14, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
    }

    .page-title {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-accent) 0%, #dd6802 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.875rem;
      color: #0c0c0e;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .user-email {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      margin-left: 0.5rem;
    }
    .logout-btn:hover {
      background: var(--color-bg-hover);
      color: var(--color-danger);
    }

    @media (max-width: 768px) {
      .user-info {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  getPageTitle(): string {
    const path = this.router.url.split('/')[1] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  }

  getUserInitial(): string {
    const user = this.authService.user();
    if (!user) return '?';
    const name = user.username || user.email;
    return name.charAt(0).toUpperCase();
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
