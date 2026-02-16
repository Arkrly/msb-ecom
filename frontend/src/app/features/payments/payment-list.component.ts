import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentResponse } from '../../core/models/payment.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header">
        <div><h1>Payments</h1><p class="sub">Track transactions</p></div>
        <a routerLink="/payments/new" class="btn-p">+ Process Payment</a>
      </div>
      @if (loading()) {
        <div class="loading-msg">Loading payments...</div>
      } @else if (payments().length > 0) {
        <div class="tw">
          <table class="dt">
            <thead><tr><th>Txn ID</th><th>Order</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              @for (p of payments(); track p.id) {
                <tr>
                  <td class="mono">{{ p.transactionId }}</td>
                  <td>{{ p.orderNumber }}</td>
                  <td>{{ p.paymentMethod }}</td>
                  <td class="accent">\${{ p.amount | number:'1.2-2' }}</td>
                  <td><span class="badge" [class]="'s-'+p.status.toLowerCase()">{{ p.status }}</span></td>
                  <td class="muted">{{ p.createdAt | date:'short' }}</td>
                  <td>@if(p.status!=='REFUNDED'){<button class="ref-btn" (click)="refund(p.transactionId)">Refund</button>}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty">No payments yet. <a routerLink="/payments/new">Process one</a></div>
      }
    </div>
  `,
  styles: [`
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
    h1{font-size:2rem;font-weight:700}.sub{color:var(--color-text-muted);font-size:.9375rem;margin-top:.25rem}
    .btn-p{padding:.625rem 1.25rem;background:linear-gradient(135deg,var(--color-accent),#dd6802);color:#0c0c0e;font-weight:600;font-size:.875rem;border-radius:var(--radius-md);text-decoration:none;font-family:var(--font-display)}
    .btn-p:hover{box-shadow:0 0 20px -4px rgba(249,142,7,.4);color:#0c0c0e}
    .tw{overflow-x:auto;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-xl)}
    .dt{width:100%;border-collapse:collapse}
    .dt th{text-align:left;padding:.75rem 1rem;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);border-bottom:1px solid var(--color-border)}
    .dt td{padding:.75rem 1rem;font-size:.875rem;border-bottom:1px solid rgba(42,42,50,.5)}
    .dt tr:last-child td{border-bottom:none}.dt tr:hover td{background:var(--color-bg-hover)}
    .mono{font-family:monospace;font-size:.8125rem}.accent{color:var(--color-accent);font-weight:600}.muted{color:var(--color-text-muted);font-size:.8125rem}
    .badge{display:inline-block;padding:.125rem .5rem;border-radius:999px;font-size:.75rem;font-weight:600}
    .s-completed,.s-success{background:rgba(69,164,74,.1);color:var(--color-success)}
    .s-pending,.s-processing{background:var(--color-accent-muted);color:var(--color-accent)}
    .s-failed{background:rgba(244,63,94,.1);color:var(--color-danger)}
    .s-refunded{background:rgba(56,189,248,.1);color:var(--color-info)}
    .ref-btn{padding:.25rem .625rem;background:transparent;border:1px solid rgba(244,63,94,.3);color:var(--color-danger);border-radius:var(--radius-md);font-size:.75rem;cursor:pointer}
    .ref-btn:hover{background:rgba(244,63,94,.1)}
    .empty{text-align:center;padding:3rem;background:var(--color-bg-secondary);border:1px dashed var(--color-border);border-radius:var(--radius-xl);color:var(--color-text-muted)}
    .empty a{color:var(--color-accent)}
    .loading-msg{text-align:center;padding:3rem;color:var(--color-text-muted)}
  `]
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  payments = signal<PaymentResponse[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.paymentService.getAllPayments().subscribe({
      next: d => { this.payments.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  refund(txnId: string) {
    this.paymentService.refundPayment(txnId).subscribe({
      next: () => { this.toastService.success('Refunded'); this.load(); },
      error: e => this.toastService.error(e.error?.message || 'Failed'),
    });
  }
}
