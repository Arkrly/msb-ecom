import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-process',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header"><h1>Process Payment</h1><p class="sub">Process a payment for an order</p></div>
      <div class="form-card">
        <form (ngSubmit)="submit()">
          <div class="fg"><label>Order Number</label><input type="text" [(ngModel)]="orderNumber" name="orderNumber" class="fi" placeholder="e.g. ORD-001" required /></div>
          <div class="fg"><label>Payment Method</label>
            <select [(ngModel)]="paymentMethod" name="paymentMethod" class="fi" required>
              <option value="">Select method</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>
          <div class="fg"><label>Amount ($)</label><input type="number" [(ngModel)]="amount" name="amount" class="fi" placeholder="0.00" step="0.01" min="0" required /></div>
          <div class="fa">
            <button type="button" class="btn-s" (click)="router.navigate(['/payments'])">Cancel</button>
            <button type="submit" class="btn-p" [disabled]="submitting()">@if(submitting()){<span class="sp"></span>}Process</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header{margin-bottom:2rem}h1{font-size:2rem;font-weight:700}.sub{color:var(--color-text-muted);font-size:.9375rem;margin-top:.25rem}
    .form-card{max-width:560px;padding:2rem;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-xl)}
    .fg{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem}
    .fg label{font-size:.8125rem;font-weight:500;color:var(--color-text-secondary)}
    .fi{width:100%;padding:.625rem .875rem;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text-primary);font-family:var(--font-body);font-size:.875rem;outline:none;transition:border-color var(--transition-fast)}
    .fi::placeholder{color:var(--color-text-muted)}.fi:focus{border-color:var(--color-accent);box-shadow:0 0 0 3px var(--color-accent-muted)}
    select.fi{appearance:none;cursor:pointer}
    .fa{display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem}
    .btn-p{display:flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;background:linear-gradient(135deg,var(--color-accent),#dd6802);color:#0c0c0e;font-weight:600;font-size:.875rem;border:none;border-radius:var(--radius-md);cursor:pointer;font-family:var(--font-display)}
    .btn-p:hover:not(:disabled){box-shadow:0 0 20px -4px rgba(249,142,7,.4)}.btn-p:disabled{opacity:.6;cursor:not-allowed}
    .btn-s{padding:.625rem 1.25rem;background:var(--color-bg-tertiary);color:var(--color-text-secondary);font-weight:500;font-size:.875rem;border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer;font-family:var(--font-display)}
    .btn-s:hover{background:var(--color-bg-hover);color:var(--color-text-primary)}
    .sp{width:14px;height:14px;border:2px solid rgba(12,12,14,.3);border-top-color:#0c0c0e;border-radius:50%;animation:spin .6s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `]
})
export class PaymentProcessComponent {
  router = inject(Router);
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  orderNumber = '';
  paymentMethod = '';
  amount: number | null = null;
  submitting = signal(false);

  submit() {
    if (!this.orderNumber || !this.paymentMethod || this.amount == null) return;
    this.submitting.set(true);
    this.paymentService.processPayment({ orderNumber: this.orderNumber, paymentMethod: this.paymentMethod, amount: this.amount }).subscribe({
      next: () => { this.toastService.success('Payment processed'); this.router.navigate(['/payments']); },
      error: e => { this.toastService.error(e.error?.message || 'Payment failed'); this.submitting.set(false); },
    });
  }
}
