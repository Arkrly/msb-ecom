import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { ProductResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page animate-fade-in">
      <div class="page-header">
        <div>
          <h1>Products</h1>
          <p class="subtitle">Manage your product catalog</p>
        </div>
        <a routerLink="/products/new" class="btn-primary">+ New Product</a>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton-card"><div class="skeleton-line w-60"></div><div class="skeleton-line w-full"></div><div class="skeleton-line w-40"></div></div>
          }
        </div>
      } @else if (products().length > 0) {
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <div class="product-card hover-glow">
              <div class="product-header">
                <div class="product-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
                </div>
                <span class="product-price">\${{ product.price | number:'1.2-2' }}</span>
              </div>
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-id">ID: {{ product.id }}</div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No products yet</h3>
          <p>Create your first product to get started</p>
          <a routerLink="/products/new" class="btn-primary">+ Add Product</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-header h1 { font-size: 2rem; font-weight: 700; }
    .subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin-top: 0.25rem; }

    .btn-primary {
      padding: 0.625rem 1.25rem;
      background: linear-gradient(135deg, var(--color-accent), #dd6802);
      color: #0c0c0e; font-weight: 600; font-size: 0.875rem;
      border-radius: var(--radius-md); text-decoration: none;
      transition: all var(--transition-fast); font-family: var(--font-display);
    }
    .btn-primary:hover { box-shadow: 0 0 20px -4px rgba(249, 142, 7, 0.4); transform: translateY(-1px); color: #0c0c0e; }

    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .product-card {
      padding: 1.25rem;
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-xl); transition: all var(--transition-fast);
    }
    .product-card:hover { border-color: var(--color-border-hover); transform: translateY(-2px); }

    .product-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .product-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--color-accent-muted); color: var(--color-accent);
      display: flex; align-items: center; justify-content: center;
    }
    .product-icon svg { width: 18px; height: 18px; }
    .product-price { font-family: var(--font-display); font-weight: 700; color: var(--color-accent); font-size: 1.125rem; }
    .product-name { font-size: 1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 0.375rem; }
    .product-description { font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 0.75rem; }
    .product-id { font-size: 0.6875rem; color: var(--color-text-muted); font-family: monospace; }

    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .skeleton-card { padding: 1.25rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-xl); }
    .skeleton-line { height: 14px; background: var(--color-bg-hover); border-radius: 4px; margin-bottom: 0.75rem; animation: pulse 1.5s ease-in-out infinite; }
    .w-60 { width: 60%; } .w-full { width: 100%; } .w-40 { width: 40%; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .empty-state {
      text-align: center; padding: 3rem; background: var(--color-bg-secondary);
      border: 1px dashed var(--color-border); border-radius: var(--radius-xl);
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.125rem; color: var(--color-text-primary); margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.5rem; }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  products = signal<ProductResponse[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.productService.getAllProducts().subscribe({
      next: (data) => { this.products.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
