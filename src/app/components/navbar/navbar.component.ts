import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CartService } from '../../services/cart.service';

import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GenralService } from '../../services/genral.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, SidebarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnDestroy {
  notificationDropDown = false;
  dropdownOpen = false;
  isSidebarOpen = false;
  isLoggedIn = true;
  user: string = '67b87e4bee6c8c97157670ed';
  numOfItems: number = 0;
  private loginSub!: Subscription;
  // private cartCountSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private genral: GenralService
  ) {
    // this.cartCountSub = this.cartService.cartCount$.subscribe(
    //   count => {
    //     this.numOfItems = count;
    //     console.log('Cart count updated:', this.numOfItems);
    //   }
    // );
    // this.cartService.getCart(this.user).subscribe();
    console.log(this.numOfItems);
  }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    this.loginSub = this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });
  }

  toggleNotifications() {
    this.notificationDropDown = !this.notificationDropDown;
  }
  closeNotifications() {
    this.notificationDropDown = false;
  }
  /////
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  ////
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }
  ////

  signOut() {
    this.authService.logout();
    this.router.navigate(['/signup']);
  }

  ngOnDestroy() {
    this.loginSub?.unsubscribe();
    // this.cartCountSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const sidebarElement = document.querySelector('.sidebar');
    const menuIcon = document.querySelector('.hamburger-icon');
    const dropdown = document.querySelector('.relative .absolute');
    const userIcon = document.querySelector('.fa-circle-user');
    const notIcon = document.querySelector('.notification');

    // Close sidebar if clicked outside
    if (
      this.isSidebarOpen &&
      sidebarElement &&
      !sidebarElement.contains(event.target as Node) &&
      menuIcon &&
      !menuIcon.contains(event.target as Node)
    ) {
      this.isSidebarOpen = false;
    }

    // Close dropdown if clicked outside
    if (
      this.dropdownOpen &&
      dropdown &&
      !dropdown.contains(event.target as Node) &&
      userIcon &&
      !userIcon.contains(event.target as Node)
    ) {
      this.dropdownOpen = false;
    }

    // Close notifications dropdown if clicked outside
    if (
      this.notificationDropDown &&
      notIcon &&
      !notIcon.contains(event.target as Node)
    ) {
      this.notificationDropDown = false;
    }
  }

  /////////////
  flagSrc: string = '/Images/usa.svg';

  toggleFlag() {
    this.flagSrc =
      this.flagSrc === '/Images/usa.svg' ? '/Images/sa.svg' : '/Images/usa.svg';
  }
}
