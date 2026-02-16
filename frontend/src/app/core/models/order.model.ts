export interface OrderRequest {
  skuCode: string;
  price: number;
  quantity: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  skuCode: string;
  price: number;
  quantity: number;
}
