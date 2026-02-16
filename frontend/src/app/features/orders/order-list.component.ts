import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse } from '../../core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header">
        <div><h1>Orders</h1><p class="subtitle">Manage customer orders</p></div>
        <a routerLink="/orders/new" class="btn-primary">+ Place Order</a>
      </div>

      @if (loading()) {
        <div class="table-wrapper"><div class="skeleton-table">@for (i of [1,2,3,4,5]; track i) { <div class="skeleton-row"><div class="skeleton-line"></div></div> }</div></div>
      } @else if (orders().length > 0) {
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Order #</th><th>SKU Code</th><th>Quantity</th><th>Price</th></tr></thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td><span class="font-medium text-primary">{{ order.orderNumber }}</span></td>
                  <td class="text-secondary">{{ order.skuCode }}</td>
                  <td><span class="badge">{{ order.quantity }}</span></td>
                  <td class="text-accent">\${{ order.price | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state"><div class="empty-icon">📋</div><h3>No orders yet</h3><p>Place your first order to get started</p><a routerLink="/orders/new" class="btn-primary">+ Place Order</a></div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; }
    .subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin-top: 0.25rem; }
    .btn-primary { padding: 0.625rem 1.25rem; background: linear-gradient(135deg, var(--color-accent), #dd6802); color: #0c0c0e; font-weight: 600; font-size: 0.875rem; border-radius: var(--radius-md); text-decoration: none; font-family: var(--font-display); transition: all var(--transition-fast); }
    .btn-primary:hover { box-shadow: 0 0 20px -4px rgba(249,142,7,0.4); transform: translateY(-1px); color: #0c0c0e; }
    .table-wrapper { overflow-x: auto; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-xl); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid rgba(42,42,50,0.5); }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--color-bg-hover); }
    .text-primary { color: var(--color-text-primary); }
    .text-secondary { color: var(--color-text-secondary); }
    .text-accent { color: var(--color-accent); font-weight: 600; }
    .font-medium { font-weight: 500; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; background: var(--color-accent-muted); color: var(--color-accent); border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .empty-state { text-align: center; padding: 3rem; background: var(--color-bg-secondary); border: 1px dashed var(--color-border); border-radius: var(--radius-xl); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.125rem; margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.5rem; }
    .skeleton-table { padding: 1rem; }
    .skeleton-row { padding: 0.75rem 0; border-bottom: 1px solid rgba(42,42,50,0.3); }
    .skeleton-line { height: 14px; width: 80%; background: var(--color-bg-hover); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  `]
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  orders = signal<OrderResponse[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.orderService.getAllOrders().subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
