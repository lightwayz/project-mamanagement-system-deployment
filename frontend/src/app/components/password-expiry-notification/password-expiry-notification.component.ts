import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';

export interface PasswordExpiryStatus {
  is_expired: boolean;
  is_expiring_soon: boolean;
  days_remaining: number;
  password_changed_at: string;
  password_expires_at: string;
  force_password_change: boolean;
}

export interface PasswordExpiryNotification {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  days_remaining?: number;
}

@Component({
  selector: 'app-password-expiry-notification',
  template: `
    <div class="notification-container" *ngIf="currentNotification">
      <mat-card class="notification-card" [ngClass]="getNotificationClass()">
        <div class="notification-header">
          <div class="notification-icon">
            <mat-icon>{{ getNotificationIcon() }}</mat-icon>
          </div>
          <div class="notification-content">
            <h4 class="notification-title">{{ currentNotification.title }}</h4>
            <p class="notification-message">{{ currentNotification.message }}</p>
          </div>
          <div class="notification-actions">
            <button mat-raised-button 
                    color="accent" 
                    (click)="openPasswordChangeDialog()"
                    class="change-password-btn">
              <mat-icon>lock_reset</mat-icon>
              Change Password
            </button>
            <button mat-icon-button 
                    (click)="dismissNotification()"
                    [disabled]="currentNotification.priority === 'high'"
                    class="dismiss-btn"
                    [matTooltip]="getDismissTooltip()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        <div class="notification-footer" *ngIf="expiryStatus?.days_remaining && (expiryStatus?.days_remaining || 0) > 0">
          <div class="days-remaining">
            <span class="days-count">{{ expiryStatus?.days_remaining }}</span>
            <span class="days-label">{{ (expiryStatus?.days_remaining || 0) === 1 ? 'day' : 'days' }} remaining</span>
          </div>
          <div class="progress-bar">
            <mat-progress-bar 
              mode="determinate" 
              [value]="getProgressValue()"
              [color]="getProgressColor()">
            </mat-progress-bar>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 1000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-card {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-left: 4px solid;
    }

    .notification-card.error {
      border-left-color: #f44336;
      background: #ffebee;
    }

    .notification-card.warning {
      border-left-color: #ff9800;
      background: #fff3e0;
    }

    .notification-card.info {
      border-left-color: #2196f3;
      background: #e3f2fd;
    }

    :host-context(.dark-theme) .notification-card.error {
      background: rgba(244, 67, 54, 0.1);
      color: var(--text-primary);
    }

    :host-context(.dark-theme) .notification-card.warning {
      background: rgba(255, 152, 0, 0.1);
      color: var(--text-primary);
    }

    :host-context(.dark-theme) .notification-card.info {
      background: rgba(33, 150, 243, 0.1);
      color: var(--text-primary);
    }

    .notification-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }

    .notification-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .notification-card.error .notification-icon {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .notification-card.warning .notification-icon {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .notification-card.info .notification-icon {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .notification-message {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .change-password-btn {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      font-size: 12px;
      padding: 8px 16px;
      min-height: auto;
    }

    .dismiss-btn {
      color: var(--text-tertiary);
      width: 32px;
      height: 32px;
    }

    .dismiss-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .notification-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .days-remaining {
      display: flex;
      align-items: baseline;
      gap: 4px;
      justify-content: center;
    }

    .days-count {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .days-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .progress-bar {
      margin-top: 4px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .notification-container {
        position: fixed;
        top: 64px;
        left: 16px;
        right: 16px;
        max-width: none;
      }

      .notification-actions {
        flex-direction: row;
        align-items: center;
      }

      .change-password-btn {
        font-size: 11px;
        padding: 6px 12px;
      }
    }
  `]
})
export class PasswordExpiryNotificationComponent implements OnInit, OnDestroy {
  @Input() expiryStatus: PasswordExpiryStatus | null = null;
  @Input() notification: PasswordExpiryNotification | null = null;
  @Output() dismissed = new EventEmitter<void>();

  currentNotification: PasswordExpiryNotification | null = null;
  private checkInterval?: Subscription;
  private dismissedNotifications = new Set<string>();

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Set initial notification
    this.currentNotification = this.notification;

    // Check for password expiry status every hour
    this.checkInterval = interval(60 * 60 * 1000) // 1 hour
      .pipe(startWith(0))
      .subscribe(() => {
        this.checkPasswordExpiryStatus();
      });
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
  }

  private checkPasswordExpiryStatus(): void {
    this.authService.getPasswordExpiryStatus().subscribe({
      next: (response) => {
        this.expiryStatus = response.password_expiry_status;
        const newNotification = response.notification;
        
        if (newNotification) {
          const notificationKey = this.getNotificationKey(newNotification);
          if (!this.dismissedNotifications.has(notificationKey)) {
            this.currentNotification = newNotification;
          }
        } else {
          this.currentNotification = null;
        }
      },
      error: (error) => {
        console.error('Failed to check password expiry status:', error);
      }
    });
  }

  getNotificationClass(): string {
    return this.currentNotification?.type || 'info';
  }

  getNotificationIcon(): string {
    switch (this.currentNotification?.type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'notification_important';
    }
  }

  getProgressValue(): number {
    if (!this.expiryStatus?.days_remaining) {
      return 0;
    }
    
    const totalDays = 90; // 90-day password policy
    const remainingDays = this.expiryStatus.days_remaining;
    return Math.max(0, (remainingDays / totalDays) * 100);
  }

  getProgressColor(): 'primary' | 'accent' | 'warn' {
    const value = this.getProgressValue();
    if (value > 30) return 'primary';
    if (value > 10) return 'accent';
    return 'warn';
  }

  getDismissTooltip(): string {
    if (this.currentNotification?.priority === 'high') {
      return 'Critical notifications cannot be dismissed';
    }
    return 'Dismiss notification';
  }

  openPasswordChangeDialog(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.snackBar.open('User information not available', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: user.id,
        userName: user.name,
        isAdminReset: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Password changed successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Clear notification and refresh status
        this.currentNotification = null;
        this.checkPasswordExpiryStatus();
      }
    });
  }

  dismissNotification(): void {
    if (this.currentNotification?.priority === 'high') {
      return; // Cannot dismiss high priority notifications
    }

    if (this.currentNotification) {
      const notificationKey = this.getNotificationKey(this.currentNotification);
      this.dismissedNotifications.add(notificationKey);
      
      // Store in localStorage to persist dismissals across sessions
      const dismissed = JSON.parse(localStorage.getItem('dismissedPasswordNotifications') || '[]');
      dismissed.push(notificationKey);
      localStorage.setItem('dismissedPasswordNotifications', JSON.stringify(dismissed));
    }

    this.currentNotification = null;
    this.dismissed.emit();
  }

  private getNotificationKey(notification: PasswordExpiryNotification): string {
    // Create a unique key for the notification based on type and days remaining
    return `${notification.type}_${notification.priority}_${notification.days_remaining || 0}`;
  }
}