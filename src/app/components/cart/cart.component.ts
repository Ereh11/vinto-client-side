import { Component, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';
import { OrderedItemsService } from '../../services/ordered-items.service';
import { ConfirmationModalComponent } from '../admin/admin-selection/confirmation-modal/confirmation-modal.component';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GenralService } from '../../services/genral.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, ConfirmationModalComponent, RouterModule],
  providers: [CartService, OrderedItemsService],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  hoveredId: string | null = null;
  cart?: Cart;
  toMuch: string = '';
  errorMessage: string = '';
  deleteRequest: EventEmitter<void> = new EventEmitter<void>();
  selectedItems: boolean[] = [];
  showDeleteModal: boolean = false;
  isLoading: boolean = false;
  deleteMode: 'single' | 'all' = 'all';
  itemToDeleteId: string = '';
  user: any;
  private authSubscription!: Subscription;
  isLoggedIn: boolean = false;
  private authSub!: Subscription;
  deliveryFees: number = 0;
  isUpdating: { [key: string]: boolean } = {};
  pendingUpdates: { [key: string]: number } = {};
  originalQuantities: { [key: string]: number } = {};
  total: number = 0;

  constructor(
    private router: Router,
    private cartService: CartService,
    private orderedItemService: OrderedItemsService,
    private genral: GenralService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.deliveryFees = this.genral.deliveryFees;
    this.loadPendingUpdatesFromStorage();
    this.authSub = this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.user = this.authService.getUserId();

      if (loggedIn && this.user) {
        // this.clearStorageUpdates();
        this.updateCart();
      } else {
      }
    });
  }

  updateCart() {
    this.cartService.getCart(this.user).subscribe((data) => {
      this.cart = data || [];
      if (this.cart?.items) {
        this.cart.items.forEach(item => {
          if (this.pendingUpdates[item.orderedItemId]) {
            item.quantity = this.pendingUpdates[item.orderedItemId];
          }
        });
      }
      this.calculateTotal();
    });
  }

  goToDetails(product: any) {
    this.router.navigate(['/details', product._id]);
  }

  removeProduct(orderedItemId: string) {
    this.isLoading = true;
    this.cartService.removeItem(this.user, orderedItemId).subscribe({
      next: () => {
        this.genral.decrement();
        this.updateCart();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false),
    });
  }

  removeAllProducts() {
    if (!this.cart || this.cart.items.length === 0) {
      return;
    }
    const removalOperations: any = [];
    this.cart.items.forEach((element) => {
      const removal$ = this.cartService.removeItem(
        this.user,
        element.orderedItemId.toString()
      );
      this.genral.decrement();
      removalOperations.push(removal$);
    });

    if (removalOperations.length > 0) {
      forkJoin(removalOperations).subscribe({
        next: () => {
          this.updateCart();
        },
        error: (err) => {
          console.error('Error removing products:', err);
          this.updateCart();
        },
      });
    }
  }

  incrementQuantity(
    max: number,
    orderedItemId: string,
    currentQuantity: number,
    event: MouseEvent
  ) {
    this.errorMessage = '';
    event.stopPropagation();
    const newQuantity = currentQuantity + 1;

    if (newQuantity > max) {
      this.toMuch = orderedItemId;
      return;
    }

    this.toMuch = '';
    this.pendingUpdates[orderedItemId] = newQuantity;
    this.updateLocalQuantity(orderedItemId, newQuantity);
  }

  decrementQuantity(
    orderedItemId: string,
    currentQuantity: number,
    event: MouseEvent
  ) {
    this.errorMessage = '';
    event.stopPropagation();
    const newQuantity = currentQuantity - 1;
    if (this.toMuch === orderedItemId) {
      this.toMuch = '';
    }
    if (newQuantity < 1) {
      this.removeProduct(orderedItemId);
      return;
    }
    this.pendingUpdates[orderedItemId] = newQuantity;
    this.updateLocalQuantity(orderedItemId, newQuantity)
  }

  private updateLocalQuantity(orderedItemId: string, newQuantity: number): void {
    const item = this.cart?.items.find(i => i.orderedItemId === orderedItemId);

    if (item) {
      if (!(orderedItemId in this.originalQuantities)) {
        this.originalQuantities[orderedItemId] = item.quantity;
      }
      item.quantity = newQuantity;
    }
    this.savePendingUpdatesToStorage();
    this.calculateTotal();

  }
  calculateTotal(): void {
    if (!this.cart || !this.cart.items) {
      this.total = 0;
      return;
    }

    this.total = this.cart?.items.reduce((sum, item) => {
      const quantity = this.pendingUpdates[item.orderedItemId] || item.quantity;
      const price = item.product.price;
      const discount = item.product.discount || 0;
      const discountedPrice = price * (1 - discount / 100);
      return sum + (discountedPrice * quantity);
    }, 0)
  }
  confirmDeleteAll() {
    this.deleteMode = 'all';
    this.showDeleteModal = true;
  }

  confirmDelete(orderedItemId: string, event: MouseEvent) {
    event.stopPropagation();
    this.deleteMode = 'single';
    this.itemToDeleteId = orderedItemId;
    this.showDeleteModal = true;
  }

  handleDeleteConfirmation(confirmed: boolean) {
    this.showDeleteModal = false;

    if (confirmed) {
      if (this.deleteMode === 'single' && this.itemToDeleteId) {
        this.removeProduct(this.itemToDeleteId);
      } else if (this.deleteMode === 'all') {
        this.removeAllProducts();
      }
    }

    this.itemToDeleteId = '';
  }

  getSelectedCount(): number {
    return this.deleteMode === 'all' && this.cart ? this.cart.items.length : 1;
  }

  checkout(): void {
    if (Object.keys(this.pendingUpdates).length > 0) {
      this.isLoading = true;

      this.cartService.updateCart(this.user, this.pendingUpdates).subscribe({
        next: (updateCart) => {
          console.log(this.user);
          this.cart = updateCart;
          console.log("test", updateCart)
          this.pendingUpdates = {};
          this.originalQuantities = {};
          this.errorMessage = '';
          this.clearStorageUpdates();
          this.router.navigate(['/checkout']);
        },
        error: (err) => {
          console.error("update failed", err);
          this.errorMessage = err.error?.message || 'Failed to update cart. Please try again.';
          Object.entries(this.originalQuantities).forEach(([id, qty]) => {
            const item = this.cart?.items.find(i => i.orderedItemId === id);
            if (item) item.quantity = qty;
          });
          this.pendingUpdates = {};
          this.originalQuantities = {};
          this.isLoggedIn = false;
        }
      })
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  private savePendingUpdatesToStorage(): void {
    localStorage.setItem('pendingCartUpdates', JSON.stringify(this.pendingUpdates));
  }

  private loadPendingUpdatesFromStorage(): void {
    const savedUpdates = localStorage.getItem('pendingCartUpdates');
    if (savedUpdates) {
      this.pendingUpdates = JSON.parse(savedUpdates);
    }
  }

  private clearStorageUpdates(): void {
    localStorage.removeItem('pendingCartUpdates');
  }
}
