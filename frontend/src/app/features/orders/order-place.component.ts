import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-order-place',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header"><h1>Place Order</h1><p class="subtitle">Create a new order</p></div>
      <div class="form-card">
        <form (ngSubmit)="handleSubmit()">
          <div class="form-group">
            <label for="skuCode">SKU Code</label>
            <div class="input-with-action">
              <input id="skuCode" type="text" [(ngModel)]="skuCode" name="skuCode" class="form-input" placeholder="e.g. SKU-001" required />
              <button type="button" class="check-btn" (click)="checkStock()" [disabled]="!skuCode || !quantity">Check Stock</button>
            </div>
            @if (stockStatus() !== null) {
              <span class="stock-badge" [class.in-stock]="stockStatus()" [class.out-of-stock]="!stockStatus()">
                {{ stockStatus() ? '✓ In Stock' : '✗ Out of Stock' }}
              </span>
            }
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="quantity">Quantity</label>
              <input id="quantity" type="number" [(ngModel)]="quantity" name="quantity" class="form-input" placeholder="1" min="1" required />
            </div>
            <div class="form-group">
              <label for="price">Price ($)</label>
              <input id="price" type="number" [(ngModel)]="price" name="price" class="form-input" placeholder="0.00" step="0.01" min="0" required />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="router.navigate(['/orders'])">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              @if (submitting()) { <span class="spinner"></span> }
              Place Order
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
    .form-card { max-width: 560px; padding: 2rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-xl); }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; }
    .form-group label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
    .form-input { width: 100%; padding: 0.625rem 0.875rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-primary); font-family: var(--font-body); font-size: 0.875rem; outline: none; transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
    .form-input::placeholder { color: var(--color-text-muted); }
    .form-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-muted); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .input-with-action { display: flex; gap: 0.5rem; }
    .input-with-action .form-input { flex: 1; }
    .check-btn { padding: 0.625rem 0.875rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: 0.8125rem; cursor: pointer; white-space: nowrap; transition: all var(--transition-fast); }
    .check-btn:hover:not(:disabled) { background: var(--color-bg-hover); color: var(--color-text-primary); }
    .check-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .stock-badge { display: inline-block; padding: 0.25rem 0.625rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; margin-top: 0.25rem; }
    .in-stock { background: rgba(69,164,74,0.1); color: var(--color-success); }
    .out-of-stock { background: rgba(244,63,94,0.1); color: var(--color-danger); }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: linear-gradient(135deg, var(--color-accent), #dd6802); color: #0c0c0e; font-weight: 600; font-size: 0.875rem; border: none; border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-display); transition: all var(--transition-fast); }
    .btn-primary:hover:not(:disabled) { box-shadow: 0 0 20px -4px rgba(249,142,7,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { padding: 0.625rem 1.25rem; background: var(--color-bg-tertiary); color: var(--color-text-secondary); font-weight: 500; font-size: 0.875rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-display); transition: all var(--transition-fast); }
    .btn-secondary:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(12,12,14,0.3); border-top-color: #0c0c0e; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OrderPlaceComponent {
  router = inject(Router);
  private orderService = inject(OrderService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);

  skuCode = '';
  quantity: number | null = null;
  price: number | null = null;
  submitting = signal(false);
  stockStatus = signal<boolean | null>(null);

  checkStock() {
    if (!this.skuCode || !this.quantity) return;
    this.inventoryService.isInStock(this.skuCode, this.quantity).subscribe({
      next: (inStock) => {
        this.stockStatus.set(inStock);
        this.toastService.info(inStock ? 'Item is in stock!' : 'Item is out of stock');
      },
      error: () => this.toastService.error('Failed to check stock'),
    });
  }

  handleSubmit() {
    if (!this.skuCode || !this.quantity || this.price == null) return;
    this.submitting.set(true);
    this.orderService.placeOrder({ skuCode: this.skuCode, quantity: this.quantity, price: this.price }).subscribe({
      next: () => { this.toastService.success('Order placed successfully'); this.router.navigate(['/orders']); },
      error: (err) => { this.toastService.error(err.error?.message || 'Failed to place order'); this.submitting.set(false); },
    });
  }
}
