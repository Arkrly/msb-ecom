import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar (collapseChanged)="onSidebarCollapse($event)" />
      <div class="main-area">
        <app-navbar />
        <main class="content bg-noise">
          <div class="content-inner">
            <router-outlet />
          </div>
        </main>
      </div>
      <app-toast-container />
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
    }

    .main-area {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      transition: margin-left var(--transition-base);
    }
    .sidebar-collapsed .main-area {
      margin-left: 72px;
    }

    .content {
      flex: 1;
      position: relative;
      overflow-y: auto;
    }
    .content-inner {
      position: relative;
      z-index: 1;
      padding: 1.5rem;
      max-width: 1400px;
    }

    @media (max-width: 768px) {
      .main-area {
        margin-left: 0;
      }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);

  onSidebarCollapse(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }
}
