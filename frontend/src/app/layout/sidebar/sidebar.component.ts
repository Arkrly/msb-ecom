import { Component, signal, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="url(#brandGrad)"/>
            <path d="M8 14l4-6 4 6-4 6-4-6z" fill="#0c0c0e" opacity="0.9"/>
            <path d="M14 10l4-2v12l-4-2V10z" fill="#0c0c0e" opacity="0.6"/>
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="28" y2="28">
                <stop stop-color="#f98e07"/>
                <stop offset="1" stop-color="#dd6802"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        @if (!collapsed()) {
          <span class="brand-text">MSB<span class="brand-accent">Commerce</span></span>
        }
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a
            class="nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
          >
            <span class="nav-icon" [innerHTML]="item.icon"></span>
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Collapse Toggle -->
      <button class="collapse-btn" (click)="toggleCollapse()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          @if (collapsed()) {
            <path d="M6 3l5 5-5 5V3z"/>
          } @else {
            <path d="M10 3L5 8l5 5V3z"/>
          }
        </svg>
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background: var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: 1.25rem 0.75rem;
      transition: width var(--transition-base);
      z-index: 40;
    }
    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;
      margin-bottom: 2rem;
    }
    .brand-icon {
      flex-shrink: 0;
    }
    .brand-text {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .brand-accent {
      color: var(--color-accent);
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius-lg);
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .nav-item:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
    .nav-item.active {
      background: var(--color-accent-muted);
      color: var(--color-accent);
    }
    .nav-item.active .nav-icon {
      color: var(--color-accent);
    }

    .nav-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-icon :deep(svg) {
      width: 20px;
      height: 20px;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
    }

    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: auto;
      padding: 0.5rem;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .collapse-btn:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  collapsed = signal(false);
  collapseChanged = output<boolean>();

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>',
    },
    {
      label: 'Products',
      route: '/products',
      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>',
    },
    {
      label: 'Orders',
      route: '/orders',
      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>',
    },
    {
      label: 'Payments',
      route: '/payments',
      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>',
    },
    {
      label: 'Inventory',
      route: '/inventory',
      icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z" clip-rule="evenodd"/></svg>',
    },
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
    this.collapseChanged.emit(this.collapsed());
  }
}
