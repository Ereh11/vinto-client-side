import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Cart, CartItem } from '../models/cart.model';
import { GenralService } from './genral.service';


@Injectable({
  providedIn: 'root'
})

export class CartService {


  private URL = "http://localhost:4000/api/cart";
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();
  private historySubject = new BehaviorSubject<any[]>([]);
  private historyData: any[] = [];

  constructor(public http: HttpClient) { }




  getHistory(userId: string): Observable<any> {
    if (this.historyData.length === 0) {
      return this.http.get(`${this.URL}/history/${userId}`).pipe(
        tap((data: any) => {
          this.historySubject.next(data);
          this.historyData = data.data.carts;
        })
      );
    } else {
      return of(this.historySubject.value);
    }
  }

  filterHistory(status: string): any[] {
    if (!this.historyData || this.historyData.length === 0) {
      return [];
    }

    if (status === 'All orders') return this.historyData;

    const statusMap: { [key: string]: string } = {
      'Completed': 'completed',
      'Cancelled': 'cancelled',
      'inprogress': 'inprogress',
      'Summary': 'summary'
    };

    return this.historyData.filter(item => {
      if (status === 'Summary') {
        return item.summaryExists;
      }

      const mappedStatus = statusMap[status];
      return item.status && item.status.toLowerCase() === mappedStatus.toLowerCase();
    });
  }

  getCart(userId: string): Observable<Cart> {
    return this.http.get<{ data: { cart: Cart } }>(`${this.URL}/${userId}`)
      .pipe(
        map((response): Cart => {
          console.log('Cart response:', response);
          return response.data.cart;
        }),
        // tap(cart => {
        //   console.log('Cart items count:', cart.items.length);
        //   this.cartCountSubject.next(cart.items.length);
        // })
      )
  }

  getAllCarts(): Observable<CartItem[]> {
    return this.http
      .get<{ data: { cart: CartItem[] } }>(`${this.URL}`)
      .pipe(
        map((response): CartItem[] => response.data.cart),
      );
  }

  updateCart(id: string, pendingUpdates: { [key: string]: number }): Observable<Cart> {
    return this.http
      .patch<{ data: { cart: Cart } }>(`${this.URL}/${id}`, pendingUpdates)
      .pipe(map((response): Cart => response.data.cart)
        // tap(cart => this.cartCountSubject.next(cart.items.length))
      );
  }

  removeItem(id: string, itemOrderedId: string) {
    return this.http.post(`${this.URL}/remove/${id}`, { itemOrderedId })
    // return this.http.post<{ data: { cart: Cart } }>(`${this.URL}/remove/${id}`, { itemOrderedId }).pipe(
    //   map(response => response.data.cart),
    //   // tap(cart => this.cartCountSubject.next(cart.items.length)) // Update count
    // );
  }

  addToCart(id: string, productId: string, quantity: number) {
    return this.http.post<{ data: { cart: Cart } }>(`${this.URL}/${id}`, { productId, quantity }).pipe(
      map(response => response.data.cart),
      // tap(cart => this.cartCountSubject.next(cart.items.length))
    );
  }
}
