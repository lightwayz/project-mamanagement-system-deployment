import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { User } from '../../models/user.model';
import { PasswordExpiryStatus, PasswordExpiryNotification } from '../password-expiry-notification/password-expiry-notification.component';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sidenavOpened = true;
  isMobile = false;
  isDarkTheme = false;
  passwordExpiryStatus: PasswordExpiryStatus | null = null;
  passwordNotification: PasswordExpiryNotification | null = null;
  
  private passwordExpirySubscription?: Subscription;

  menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'salesperson', 'technician'] },
    { path: '/clients', icon: 'people', label: 'Clients', roles: ['admin', 'salesperson'] },
    { path: '/build-systems', icon: 'account_tree', label: 'Build System', roles: ['admin', 'salesperson', 'technician'] },
    { path: '/projects', icon: 'work', label: 'Projects', roles: ['admin', 'salesperson', 'technician'] },
    { path: '/inventory', icon: 'inventory', label: 'Inventory', roles: ['admin', 'salesperson', 'technician'] },
    { path: '/reports', icon: 'assessment', label: 'Reports', roles: ['admin', 'salesperson'] },
    { path: '/users', icon: 'group', label: 'Users', roles: ['admin'] },
    { path: '/settings', icon: 'settings', label: 'Settings', roles: ['admin'] }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.initializePasswordExpiryCheck();
      }
    });

    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
    
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    if (this.passwordExpirySubscription) {
      this.passwordExpirySubscription.unsubscribe();
    }
  }

  private initializePasswordExpiryCheck(): void {
    // Check password expiry status every 30 minutes
    this.passwordExpirySubscription = interval(30 * 60 * 1000) // 30 minutes
      .pipe(startWith(0))
      .subscribe(() => {
        this.checkPasswordExpiry();
      });
  }

  private checkPasswordExpiry(): void {
    if (!this.currentUser) return;

    this.authService.getPasswordExpiryStatus().subscribe({
      next: (response) => {
        this.passwordExpiryStatus = response.password_expiry_status;
        this.passwordNotification = response.notification;
      },
      error: (error) => {
        console.error('Failed to check password expiry status:', error);
      }
    });
  }

  onNotificationDismissed(): void {
    this.passwordNotification = null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasAccess(roles: string[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
  
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidenavOpened = false;
    } else {
      this.sidenavOpened = true;
    }
  }
  
  getSidenavMode(): 'over' | 'side' {
    return this.isMobile ? 'over' : 'side';
  }
  
  onSidenavBackdropClick(): void {
    if (this.isMobile) {
      this.sidenavOpened = false;
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}