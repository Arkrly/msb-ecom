import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header">
        <h1>New Product</h1>
        <p class="subtitle">Add a new product to your catalog</p>
      </div>

      <div class="form-card">
        <form (ngSubmit)="handleSubmit()">
          <div class="form-group">
            <label for="name">Product Name</label>
            <input id="name" type="text" [(ngModel)]="name" name="name" class="form-input" placeholder="Enter product name" required />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" [(ngModel)]="description" name="description" class="form-input form-textarea" placeholder="Describe the product" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label for="price">Price ($)</label>
            <input id="price" type="number" [(ngModel)]="price" name="price" class="form-input" placeholder="0.00" step="0.01" min="0" required />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="router.navigate(['/products'])">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              @if (submitting()) { <span class="spinner"></span> }
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; }
    .subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin-top: 0.25rem; }

    .form-card {
      max-width: 560px; padding: 2rem; background: var(--color-bg-secondary);
      border: 1px solid var(--color-border); border-radius: var(--radius-xl);
    }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
    .form-input {
      padding: 0.625rem 0.875rem; background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      color: var(--color-text-primary); font-family: var(--font-body); font-size: 0.875rem;
      outline: none; transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input::placeholder { color: var(--color-text-muted); }
    .form-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-muted); }
    .form-textarea { resize: vertical; min-height: 100px; }

    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-primary {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1.25rem; background: linear-gradient(135deg, var(--color-accent), #dd6802);
      color: #0c0c0e; font-weight: 600; font-size: 0.875rem; border: none;
      border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-display);
      transition: all var(--transition-fast);
    }
    .btn-primary:hover:not(:disabled) { box-shadow: 0 0 20px -4px rgba(249, 142, 7, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: 0.625rem 1.25rem; background: var(--color-bg-tertiary);
      color: var(--color-text-secondary); font-weight: 500; font-size: 0.875rem; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-display);
      transition: all var(--transition-fast);
    }
    .btn-secondary:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }

    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(12,12,14,0.3);
      border-top-color: #0c0c0e; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProductCreateComponent {
  router = inject(Router);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  name = '';
  description = '';
  price: number | null = null;
  submitting = signal(false);

  handleSubmit() {
    if (!this.name || !this.description || this.price == null) return;
    this.submitting.set(true);

    this.productService.createProduct({
      name: this.name,
      description: this.description,
      price: this.price,
    }).subscribe({
      next: () => {
        this.toastService.success('Product created successfully');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to create product');
        this.submitting.set(false);
      },
    });
  }
}
