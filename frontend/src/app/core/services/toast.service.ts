import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly toastList = signal<Toast[]>([]);
  readonly toasts = this.toastList.asReadonly();

  success(message: string): void {
    this.addToast(message, 'success');
  }

  error(message: string): void {
    this.addToast(message, 'error');
  }

  info(message: string): void {
    this.addToast(message, 'info');
  }

  warning(message: string): void {
    this.addToast(message, 'warning');
  }

  dismiss(id: number): void {
    this.toastList.update(toasts => toasts.filter(t => t.id !== id));
  }

  private addToast(message: string, type: Toast['type']): void {
    const id = this.nextId++;
    this.toastList.update(toasts => [...toasts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
