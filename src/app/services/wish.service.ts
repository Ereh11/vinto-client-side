import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { WishlistResponse } from '../models/wish.model';

@Injectable({
  providedIn: 'root',
})
export class WishService {
  URL: string = 'https://vinto-ecommerce-api-production.up.railway.app/api/wishlist';

  constructor(private http: HttpClient) {}

  getAll(id: string): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(`${this.URL}/${id}`);
  }

  removeOne(id: string, product: string) {
    return this.http.delete(`${this.URL}`, {
      body: { user: id, products: [product] },
    });
  }

  removeAll(id: string) {
    return this.http.delete(`${this.URL}/${id}`);
  }
  addWish(id: string, product: string) {
    console.log('Adding to wishlist', this.URL, id, product);
    console.log('Adding to wishlist', { user: id, products: [product] });
    return this.http.post(`${this.URL}`, { user: id, products: [product] });
  }
}
