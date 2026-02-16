import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ToastContainerComponent],
  template: `
    <div class="login-page bg-noise">
      <div class="login-container">
        <!-- Brand -->
        <div class="login-brand">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="url(#lg)"/>
            <path d="M8 14l4-6 4 6-4 6-4-6z" fill="#0c0c0e" opacity="0.9"/>
            <path d="M14 10l4-2v12l-4-2V10z" fill="#0c0c0e" opacity="0.6"/>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#f98e07"/><stop offset="1" stop-color="#dd6802"/></linearGradient></defs>
          </svg>
          <h1 class="brand-title">MSB<span class="accent">Commerce</span></h1>
          <p class="brand-subtitle">{{ isSignup() ? 'Create your account' : 'Sign in to your account' }}</p>
        </div>

        <!-- Form -->
        <form class="login-form" (ngSubmit)="handleSubmit()">
          @if (isSignup()) {
            <div class="form-group">
              <label for="username">Username</label>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter username"
                class="form-input"
              />
            </div>
          }

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="you&#64;example.com"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              class="form-input"
              required
              minlength="8"
            />
          </div>

          @if (errorMsg()) {
            <div class="error-message">{{ errorMsg() }}</div>
          }

          <button type="submit" class="submit-btn" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            {{ isSignup() ? 'Create Account' : 'Sign In' }}
          </button>
        </form>

        <!-- Toggle -->
        <p class="toggle-text">
          {{ isSignup() ? 'Already have an account?' : "Don't have an account?" }}
          <button class="toggle-btn" (click)="toggleMode()">
            {{ isSignup() ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>
      <app-toast-container />
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
      position: relative;
    }

    .login-container {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-brand {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-brand svg {
      margin: 0 auto 1rem;
    }
    .brand-title {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 0.25rem;
    }
    .accent { color: var(--color-accent); }
    .brand-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-group label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .form-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      font-size: 0.875rem;
      outline: none;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input::placeholder {
      color: var(--color-text-muted);
    }
    .form-input:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }

    .error-message {
      font-size: 0.8125rem;
      color: var(--color-danger);
      padding: 0.5rem 0.75rem;
      background: rgba(244, 63, 94, 0.08);
      border-radius: var(--radius-md);
      border: 1px solid rgba(244, 63, 94, 0.2);
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, var(--color-accent) 0%, #dd6802 100%);
      color: #0c0c0e;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .submit-btn:hover:not(:disabled) {
      box-shadow: 0 0 24px -4px rgba(249, 142, 7, 0.4);
      transform: translateY(-1px);
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(12, 12, 14, 0.3);
      border-top-color: #0c0c0e;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .toggle-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }
    .toggle-btn {
      background: none;
      border: none;
      color: var(--color-accent);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      font-family: var(--font-body);
    }
    .toggle-btn:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  email = '';
  password = '';
  username = '';
  isSignup = signal(false);
  submitting = signal(false);
  errorMsg = signal('');

  toggleMode() {
    this.isSignup.update(v => !v);
    this.errorMsg.set('');
  }

  handleSubmit() {
    this.errorMsg.set('');
    this.submitting.set(true);

    if (this.isSignup()) {
      this.authService.signup({
        email: this.email,
        password: this.password,
        username: this.username || undefined,
      }).subscribe({
        next: () => {
          this.toastService.success('Account created! Please sign in.');
          this.isSignup.set(false);
          this.submitting.set(false);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Signup failed');
          this.submitting.set(false);
        }
      });
    } else {
      this.authService.login({
        email: this.email,
        password: this.password,
      }).subscribe({
        next: () => {
          this.toastService.success('Welcome back!');
          this.router.navigate(['/dashboard']);
          this.submitting.set(false);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Invalid credentials');
          this.submitting.set(false);
        }
      });
    }
  }
}
