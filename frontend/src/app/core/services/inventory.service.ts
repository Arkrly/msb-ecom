import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly baseUrl = `${environment.apiGatewayUrl}/api/inventory`;

  constructor(private http: HttpClient) {}

  isInStock(skuCode: string, quantity: number): Observable<boolean> {
    return this.http.get<boolean>(this.baseUrl, {
      params: { skuCode, quantity: quantity.toString() },
      withCredentials: true,
    });
  }
}
