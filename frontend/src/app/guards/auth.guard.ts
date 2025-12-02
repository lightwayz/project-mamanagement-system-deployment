import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { PasswordChangeComponent } from '../components/password-change/password-change.component';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private apiService: ApiService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check password expiry status
    return this.apiService.getPasswordStatus().pipe(
      map(status => {
        if (status.is_expired) {
          // Password has expired - force password change
          this.openForcePasswordChangeDialog();
          return false;
        }
        return true;
      }),
      catchError(error => {
        // If password status check fails, allow access but log error
        console.error('Failed to check password status:', error);
        return of(true);
      })
    );
  }

  private openForcePasswordChangeDialog(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true, // User cannot close without changing password
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        isAdminReset: false,
        isForced: true // Flag to indicate this is a forced password change
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Password successfully changed - refresh the page to continue
        window.location.reload();
      } else {
        // User cancelled or failed - logout and redirect to login
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}