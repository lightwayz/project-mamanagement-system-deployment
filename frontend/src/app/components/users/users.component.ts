import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';

@Component({
  selector: 'app-users',
  template: `
    <div class="users-container">
      <div class="header">
        <h2>User Management</h2>
        <button mat-raised-button color="primary" (click)="addUser()">
          <mat-icon>add</mat-icon>
          Add User
        </button>
      </div>
      
      <mat-card>
        <mat-card-content>
          <mat-table [dataSource]="users" class="mat-elevation-z8">
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
              <mat-cell *matCellDef="let user">{{user.name}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
              <mat-cell *matCellDef="let user">{{user.email}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="role">
              <mat-header-cell *matHeaderCellDef>Role</mat-header-cell>
              <mat-cell *matCellDef="let user">
                <mat-chip [color]="getRoleColor(user.role)">
                  {{user.role | titlecase}}
                </mat-chip>
              </mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="created_at">
              <mat-header-cell *matHeaderCellDef>Created</mat-header-cell>
              <mat-cell *matCellDef="let user">{{user.created_at | date:'short'}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
              <mat-cell *matCellDef="let user">
                <button mat-icon-button (click)="editUser(user)" matTooltip="Edit User">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="resetPassword(user)" 
                        [matTooltip]="isCurrentUser(user) ? 'Change Your Password' : 'Reset Password'">
                  <mat-icon>{{ isCurrentUser(user) ? 'lock' : 'lock_reset' }}</mat-icon>
                </button>
                <button mat-icon-button (click)="toggleUserStatus(user)" 
                        [disabled]="isCurrentUser(user)"
                        [matTooltip]="isCurrentUser(user) ? 'Cannot modify own status' : (user.is_active ? 'Deactivate User' : 'Activate User')">
                  <mat-icon>{{user.is_active ? 'block' : 'check_circle'}}</mat-icon>
                </button>
              </mat-cell>
            </ng-container>
            
            <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
          </mat-table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .mat-table {
      width: 100%;
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'role', 'created_at', 'actions'];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService.get<User[]>('/users').subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Refresh the user list
        this.snackBar.open('User added successfully', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  editUser(user: User): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.snackBar.open('Please log in to continue', 'Close', { duration: 3000 });
      return;
    }

    // Check if user is editing themselves or if they're an admin
    const isCurrentUser = user.id === currentUser.id;
    if (!isCurrentUser && !this.authService.isAdmin()) {
      this.snackBar.open('You do not have permission to edit other users', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        user: user,
        isCurrentUser: isCurrentUser
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Refresh the user list
        this.snackBar.open('User updated successfully', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  resetPassword(user: User): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.snackBar.open('Please log in to continue', 'Close', { duration: 3000 });
      return;
    }

    const isAdminReset = user.id !== currentUser.id;
    
    if (isAdminReset && !this.authService.isAdmin()) {
      this.snackBar.open('You do not have permission to reset other users passwords', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: user.id,
        userName: user.name,
        isAdminReset: isAdminReset
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Password was changed successfully
        this.loadUsers(); // Refresh the user list
      }
    });
  }

  toggleUserStatus(user: User): void {
    if (this.isCurrentUser(user)) {
      this.snackBar.open('Cannot modify your own account status', 'Close', { duration: 3000 });
      return;
    }

    const action = user.is_active ? 'deactivate' : 'activate';
    const message = `Are you sure you want to ${action} ${user.name}?`;
    
    if (confirm(message)) {
      this.apiService.patch(`/users/${user.id}/toggle-status`, {}).subscribe({
        next: (response: any) => {
          this.snackBar.open(response.message, 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadUsers();
        },
        error: (error: any) => {
          this.snackBar.open(error.error?.message || 'Failed to update user status', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  isCurrentUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? currentUser.id === user.id : false;
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'primary';
      case 'salesperson': return 'accent';
      case 'technician': return 'warn';
      default: return '';
    }
  }
}