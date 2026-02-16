import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { OrderResponse } from '../../core/models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="dashboard animate-fade-in">
      <div class="page-header">
        <h1>Overview</h1>
        <p class="subtitle">Your commerce platform at a glance</p>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon products-icon">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ productCount() }}</span>
            <span class="stat-label">Products</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orders-icon">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ orderCount() }}</span>
            <span class="stat-label">Orders</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon payments-icon">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ paymentCount() }}</span>
            <span class="stat-label">Payments</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h3 class="section-title">Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/products/new" class="action-card hover-glow">
            <span class="action-icon">+</span>
            <span>New Product</span>
          </a>
          <a routerLink="/orders/new" class="action-card hover-glow">
            <span class="action-icon">+</span>
            <span>Place Order</span>
          </a>
          <a routerLink="/payments/new" class="action-card hover-glow">
            <span class="action-icon">+</span>
            <span>Process Payment</span>
          </a>
          <a routerLink="/inventory" class="action-card hover-glow">
            <span class="action-icon">⚡</span>
            <span>Check Stock</span>
          </a>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Recent Orders</h3>
          <a routerLink="/orders" class="view-all">View all →</a>
        </div>
        @if (recentOrders().length > 0) {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                @for (order of recentOrders(); track order.id) {
                  <tr>
                    <td><span class="order-number">{{ order.orderNumber }}</span></td>
                    <td class="text-secondary">{{ order.skuCode }}</td>
                    <td>{{ order.quantity }}</td>
                    <td class="text-accent">\${{ order.price | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <p>No orders yet. <a routerLink="/orders/new">Place your first order</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .subtitle { color: var(--color-text-muted); font-size: 0.9375rem; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      transition: all var(--transition-fast);
    }
    .stat-card:hover {
      border-color: var(--color-border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon svg { width: 22px; height: 22px; }
    .products-icon { background: var(--color-accent-muted); color: var(--color-accent); }
    .orders-icon { background: rgba(56, 189, 248, 0.1); color: var(--color-info); }
    .payments-icon { background: rgba(69, 164, 74, 0.1); color: var(--color-success); }

    .stat-content { display: flex; flex-direction: column; }
    .stat-value {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .stat-label {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .section { margin-bottom: 2rem; }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .section-header .section-title { margin-bottom: 0; }
    .view-all {
      font-size: 0.8125rem;
      color: var(--color-accent);
      font-weight: 500;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    .action-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .action-card:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .action-icon {
      font-size: 1.125rem;
      color: var(--color-accent);
    }

    .table-wrapper {
      overflow-x: auto;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }
    .data-table td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(42, 42, 50, 0.5);
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--color-bg-hover); }

    .order-number {
      font-family: var(--font-display);
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .text-secondary { color: var(--color-text-secondary); }
    .text-accent { color: var(--color-accent); font-weight: 600; }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--color-text-muted);
      background: var(--color-bg-secondary);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-xl);
    }
    .empty-state a { color: var(--color-accent); font-weight: 500; }
  `]
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);

  productCount = signal(0);
  orderCount = signal(0);
  paymentCount = signal(0);
  recentOrders = signal<OrderResponse[]>([]);

  ngOnInit() {
    this.productService.getAllProducts().subscribe({
      next: (products) => this.productCount.set(products.length),
      error: () => this.productCount.set(0),
    });

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orderCount.set(orders.length);
        this.recentOrders.set(orders.slice(-5).reverse());
      },
      error: () => this.orderCount.set(0),
    });

    this.paymentService.getAllPayments().subscribe({
      next: (payments) => this.paymentCount.set(payments.length),
      error: () => this.paymentCount.set(0),
    });
  }
}
