import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { AuthService } from '../../services/auth.service';
import { PasswordStatus } from '../../models/user.model';

@Component({
  selector: 'app-password-notification',
  templateUrl: './password-notification.component.html',
  styleUrls: ['./password-notification.component.scss']
})
export class PasswordNotificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  passwordStatus: PasswordStatus | null = null;
  showNotification = false;

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkPasswordStatus();
    // Check password status every hour
    setInterval(() => {
      this.checkPasswordStatus();
    }, 60 * 60 * 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPasswordStatus() {
    this.apiService.getPasswordStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status: PasswordStatus) => {
          this.passwordStatus = status;
          this.showNotification = status.is_expiring_soon || status.is_expired;
        },
        error: (error) => {
          console.error('Error checking password status:', error);
        }
      });
  }

  openPasswordChangeDialog() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        isAdminReset: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh password status after successful change
        setTimeout(() => {
          this.checkPasswordStatus();
        }, 1000);
      }
    });
  }

  hideNotification() {
    console.log('Hide notification clicked');
    this.showNotification = false;
  }

  dismissNotification() {
    console.log('Dismiss notification clicked'); // Debug log
    this.showNotification = false;
    // Show again after 24 hours for expiring passwords, or after 1 hour for expired passwords
    if (this.passwordStatus) {
      const delay = this.passwordStatus.is_expired ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour for expired, 24 hours for expiring
      console.log('Setting timeout for', delay, 'ms'); // Debug log
      setTimeout(() => {
        this.showNotification = true;
      }, delay);
    }
  }

  getNotificationMessage(): string {
    if (!this.passwordStatus) return '';
    
    if (this.passwordStatus.is_expired) {
      return 'Your password has expired. You must change it now.';
    } else if (this.passwordStatus.is_expiring_soon) {
      const days = this.passwordStatus.days_remaining;
      return `Your password expires in ${days} day${days === 1 ? '' : 's'}. Please change it soon.`;
    }
    return '';
  }

  getNotificationType(): string {
    if (!this.passwordStatus) return 'info';
    return this.passwordStatus.is_expired ? 'error' : 'warning';
  }
}