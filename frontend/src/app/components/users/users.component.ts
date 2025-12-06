import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { AfterViewInit } from '@angular/core';


import { PasswordChangeComponent } from '../password-change/password-change.component';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

interface UsersApiResponse {
  data: User[];
  pagination: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

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

          <mat-table [dataSource]="dataSource" matSort class="mat-elevation-z8">

            <!-- NAME -->
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
              <mat-cell *matCellDef="let user">{{ user.name }}</mat-cell>
            </ng-container>

            <!-- EMAIL -->
            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Email</mat-header-cell>
              <mat-cell *matCellDef="let user">{{ user.email }}</mat-cell>
            </ng-container>

            <!-- ROLE -->
            <ng-container matColumnDef="role">
              <mat-header-cell *matHeaderCellDef>Role</mat-header-cell>
              <mat-cell *matCellDef="let user">
                <mat-chip [color]="getRoleColor(user.role)">
                  {{ user.role | titlecase }}
                </mat-chip>
              </mat-cell>
            </ng-container>

            <!-- CREATED AT -->
            <ng-container matColumnDef="created_at">
              <mat-header-cell *matHeaderCellDef mat-sort-header>Created</mat-header-cell>
              <mat-cell *matCellDef="let user">{{ user.created_at | date:'short' }}</mat-cell>
            </ng-container>

            <!-- ACTIONS -->
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
                        [matTooltip]="isCurrentUser(user) ? 'Cannot modify own status' : (user.is_active ? 'Deactivate' : 'Activate')">
                  <mat-icon>{{ user.is_active ? 'block' : 'check_circle' }}</mat-icon>
                </button>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>

          </mat-table>

          <mat-paginator [length]="totalUsers"
                         [pageSize]="20"
                         [pageSizeOptions]="[10,20,50,100]">
          </mat-paginator>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container { padding: 24px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .mat-table { width: 100%; }
  `]
})
export class UsersComponent implements OnInit, AfterViewInit {


  displayedColumns: string[] = ['name', 'email', 'role', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  totalUsers = 0;

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
      private apiService: ApiService,
      private authService: AuthService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService.get<UsersApiResponse>('/users').subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.totalUsers = res.pagination.total;
      },
      error: () => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }


  addUser(): void {
    const ref = this.dialog.open(AddUserDialogComponent, {
      width: '600px',
      disableClose: true
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  editUser(user: User): void {
    const current = this.authService.getCurrentUser();
    const isSelf = current && user.id === current.id;

    if (!isSelf && !this.authService.isAdmin()) {
      this.snackBar.open('You do not have permission', 'Close', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { user, isCurrentUser: isSelf }
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  resetPassword(user: User): void {
    const current = this.authService.getCurrentUser();
    const isAdminReset = user.id !== current?.id;

    if (isAdminReset && !this.authService.isAdmin()) {
      this.snackBar.open('Not allowed', 'Close', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: { userId: user.id, userName: user.name, isAdminReset }
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  toggleUserStatus(user: User): void {
    if (this.isCurrentUser(user)) {
      this.snackBar.open('Cannot modify own status', 'Close', { duration: 3000 });
      return;
    }

    const action = user.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    this.apiService.patch(`/users/${user.id}/toggle-status`, {}).subscribe({
      next: (res: any) => {
        this.snackBar.open(res.message, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
      }
    });
  }

  isCurrentUser(user: User): boolean {
    const current = this.authService.getCurrentUser();
    return current?.id === user.id;
  }

  getRoleColor(role: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (role) {
      case 'admin': return 'primary';
      case 'salesperson': return 'accent';
      case 'technician': return 'warn';
      default: return undefined;
    }
  }
}
