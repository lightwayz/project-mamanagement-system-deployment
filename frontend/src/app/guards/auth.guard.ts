import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { PasswordChangeComponent } from '../components/password-change/password-change.component';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

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
  ): Observable<boolean> {

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    }

    return this.apiService.getPasswordStatus().pipe(
        map(status => {
          if (status.is_expired) {
            this.openForcePasswordChangeDialog();
            return false;
          }
          return true;
        }),
        catchError(error => {
          console.error('Failed to check password status:', error);

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
            return of(false);
          }

          return of(true);
        })
    );
  }

  private openForcePasswordChangeDialog(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        isAdminReset: false,
        isForced: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        window.location.reload();
      } else {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
