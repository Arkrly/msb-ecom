import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-inventory-check',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header"><h1>Inventory</h1><p class="sub">Check product stock availability</p></div>
      <div class="form-card">
        <form (ngSubmit)="check()">
          <div class="form-row">
            <div class="fg"><label>SKU Code</label><input type="text" [(ngModel)]="skuCode" name="skuCode" class="fi" placeholder="e.g. SKU-001" required /></div>
            <div class="fg"><label>Quantity</label><input type="number" [(ngModel)]="quantity" name="quantity" class="fi" placeholder="1" min="1" required /></div>
          </div>
          <button type="submit" class="btn-p" [disabled]="checking()">
            @if (checking()) { <span class="sp"></span> }
            Check Availability
          </button>
        </form>

        @if (result() !== null) {
          <div class="result" [class.in-stock]="result()" [class.out-of-stock]="!result()">
            <div class="result-icon">{{ result() ? '✓' : '✗' }}</div>
            <div>
              <h3>{{ result() ? 'In Stock' : 'Out of Stock' }}</h3>
              <p>{{ skuCode }} × {{ quantity }} is {{ result() ? 'available' : 'not available' }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header{margin-bottom:2rem}h1{font-size:2rem;font-weight:700}.sub{color:var(--color-text-muted);font-size:.9375rem;margin-top:.25rem}
    .form-card{max-width:560px;padding:2rem;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-xl)}
    .fg{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem;flex:1}
    .fg label{font-size:.8125rem;font-weight:500;color:var(--color-text-secondary)}
    .fi{width:100%;padding:.625rem .875rem;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text-primary);font-family:var(--font-body);font-size:.875rem;outline:none}
    .fi:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-muted)}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    .btn-p{display:flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;background:linear-gradient(135deg,var(--color-accent),#dd6802);color:#0c0c0e;font-weight:600;font-size:.875rem;border:none;border-radius:var(--radius-md);cursor:pointer;font-family:var(--font-display);width:100%}
    .btn-p:hover:not(:disabled){box-shadow:0 0 20px -4px rgba(249,142,7,.4)}.btn-p:disabled{opacity:.6;cursor:not-allowed}
    .result{display:flex;align-items:center;gap:1rem;margin-top:1.5rem;padding:1rem;border-radius:var(--radius-lg);animation:fadeIn .3s ease-out}
    .in-stock{background:rgba(69,164,74,.08);border:1px solid rgba(69,164,74,.2)}
    .out-of-stock{background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2)}
    .result-icon{font-size:1.5rem;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%}
    .in-stock .result-icon{background:rgba(69,164,74,.15);color:var(--color-success)}
    .out-of-stock .result-icon{background:rgba(244,63,94,.15);color:var(--color-danger)}
    .result h3{font-size:1rem;margin-bottom:.125rem}
    .in-stock h3{color:var(--color-success)}.out-of-stock h3{color:var(--color-danger)}
    .result p{font-size:.8125rem;color:var(--color-text-secondary)}
    .sp{width:14px;height:14px;border:2px solid rgba(12,12,14,.3);border-top-color:#0c0c0e;border-radius:50%;animation:spin .6s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `]
})
export class InventoryCheckComponent {
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  skuCode = '';
  quantity: number | null = null;
  checking = signal(false);
  result = signal<boolean | null>(null);

  check() {
    if (!this.skuCode || !this.quantity) return;
    this.checking.set(true);
    this.result.set(null);
    this.inventoryService.isInStock(this.skuCode, this.quantity).subscribe({
      next: v => { this.result.set(v); this.checking.set(false); },
      error: () => { this.toastService.error('Failed to check'); this.checking.set(false); },
    });
  }
}
