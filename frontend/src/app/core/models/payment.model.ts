export interface PaymentRequest {
  orderNumber: string;
  paymentMethod: string;
  amount: number;
}

export interface PaymentResponse {
  id: number;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  status: string;
  transactionId: string;
  createdAt: string;
}
