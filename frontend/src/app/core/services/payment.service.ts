import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse } from '../models/payment.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiGatewayUrl}/api/payment`;

  constructor(private http: HttpClient) {}

  getAllPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.baseUrl, { withCredentials: true });
  }

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, request, { withCredentials: true });
  }

  getPaymentsByOrder(orderNumber: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/order/${orderNumber}`, { withCredentials: true });
  }

  getPaymentByTransaction(transactionId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/transaction/${transactionId}`, { withCredentials: true });
  }

  refundPayment(transactionId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/refund/${transactionId}`, {}, { withCredentials: true });
  }
}
