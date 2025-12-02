import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-edit-user-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>edit</mat-icon>
        </div>
        <div class="header-text">
          <h2>Edit User</h2>
          <p>Update user account information and role</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="userForm" class="user-form">
        <div class="form-field">
          <label class="field-label">Full Name *</label>
          <input type="text" 
                 class="form-input" 
                 formControlName="name" 
                 placeholder="Enter user's full name">
          <div *ngIf="userForm.get('name')?.hasError('required') && userForm.get('name')?.touched" 
               class="error-message">
            Name is required
          </div>
          <div *ngIf="userForm.get('name')?.hasError('minlength') && userForm.get('name')?.touched" 
               class="error-message">
            Name must be at least 2 characters long
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Email Address *</label>
          <input type="email" 
                 class="form-input" 
                 formControlName="email" 
                 placeholder="user@example.com">
          <div *ngIf="userForm.get('email')?.hasError('required') && userForm.get('email')?.touched" 
               class="error-message">
            Email is required
          </div>
          <div *ngIf="userForm.get('email')?.hasError('email') && userForm.get('email')?.touched" 
               class="error-message">
            Please enter a valid email address
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Role *</label>
          <mat-select formControlName="role" 
                      class="form-select" 
                      placeholder="Select user role">
            <mat-select-trigger>
              <span class="selected-role">
                <mat-icon class="trigger-icon" 
                          [ngClass]="{
                            'admin': userForm.get('role')?.value === 'admin',
                            'salesperson': userForm.get('role')?.value === 'salesperson', 
                            'technician': userForm.get('role')?.value === 'technician'
                          }">
                  {{ getRoleIcon(userForm.get('role')?.value) }}
                </mat-icon>
                <span class="trigger-text">{{ getRoleName(userForm.get('role')?.value) }}</span>
              </span>
            </mat-select-trigger>
            <mat-option value="admin">
              <div class="role-option">
                <mat-icon class="role-icon admin">admin_panel_settings</mat-icon>
                <div class="role-info">
                  <div class="role-name">Administrator</div>
                  <div class="role-desc">Full system access and user management</div>
                </div>
              </div>
            </mat-option>
            <mat-option value="salesperson">
              <div class="role-option">
                <mat-icon class="role-icon salesperson">person</mat-icon>
                <div class="role-info">
                  <div class="role-name">Salesperson</div>
                  <div class="role-desc">Manage clients and projects</div>
                </div>
              </div>
            </mat-option>
            <mat-option value="technician">
              <div class="role-option">
                <mat-icon class="role-icon technician">build</mat-icon>
                <div class="role-info">
                  <div class="role-name">Technician</div>
                  <div class="role-desc">Field work and installations</div>
                </div>
              </div>
            </mat-option>
          </mat-select>
          <div *ngIf="userForm.get('role')?.hasError('required') && userForm.get('role')?.touched" 
               class="error-message">
            Role selection is required
          </div>
        </div>

        <div class="account-status-section" *ngIf="!isCurrentUser">
          <div class="section-header">
            <mat-icon>account_circle</mat-icon>
            <span>Account Status</span>
          </div>
          
          <mat-checkbox formControlName="is_active" class="status-checkbox">
            Account is active
          </mat-checkbox>
          <div class="status-info">
            Inactive users cannot log in to the system
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        Cancel
      </button>
      <button mat-flat-button 
              [disabled]="userForm.invalid || isLoading || !hasChanges()"
              (click)="onSave()" 
              class="save-btn">
        <mat-icon *ngIf="isLoading" class="loading-icon">refresh</mat-icon>
        Update User
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 32px 32px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -24px -24px 0 -24px;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    
    .header-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .header-text h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    
    .close-button {
      color: white;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      padding: 0;
      overflow: hidden;
      border-radius: 50%;
    }
    
    .close-x {
      font-size: 24px;
      font-weight: 300;
      line-height: 1;
      color: white;
      display: block;
      width: 24px;
      height: 24px;
      text-align: center;
    }
    
    .dialog-content {
      padding: 32px !important;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 500px;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      color: var(--text-primary);
      background-color: var(--surface-color);
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }
    
    .form-input::placeholder {
      color: var(--text-tertiary);
    }
    
    .form-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-input:hover {
      border-color: var(--text-secondary);
    }
    
    .form-select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      background-color: var(--surface-color);
    }
    
    .role-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    
    .role-icon {
      width: 24px;
      height: 24px;
      font-size: 20px;
    }
    
    .role-icon.admin {
      color: #3b82f6;
    }
    
    .role-icon.salesperson {
      color: #10b981;
    }
    
    .role-icon.technician {
      color: #f59e0b;
    }
    
    .role-info {
      display: flex;
      flex-direction: column;
    }
    
    .role-name {
      font-weight: 500;
      font-size: 14px;
    }
    
    .role-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .selected-role {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trigger-icon {
      width: 18px;
      height: 18px;
      font-size: 16px;
    }
    
    .trigger-icon.admin {
      color: #3b82f6;
    }
    
    .trigger-icon.salesperson {
      color: #10b981;
    }
    
    .trigger-icon.technician {
      color: #f59e0b;
    }
    
    .trigger-text {
      font-size: 14px;
      font-weight: 500;
    }
    
    .account-status-section {
      background: var(--hover-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-top: 8px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .section-header mat-icon {
      color: #667eea;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .status-checkbox {
      margin-bottom: 8px;
    }
    
    .status-info {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    
    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: 4px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px 32px 32px !important;
      margin: 0 -24px -24px !important;
      background: var(--hover-color);
      border-top: 1px solid var(--border-color);
      gap: 16px;
    }
    
    .cancel-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      border: 2px solid var(--border-color);
      color: var(--text-secondary);
      background: var(--surface-color);
      min-width: 120px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .cancel-btn:hover {
      background-color: var(--hover-color);
      border-color: var(--text-secondary);
    }
    
    .save-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      min-width: 140px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      transform: translateY(-1px);
    }
    
    .save-btn:disabled {
      background: var(--text-tertiary);
      color: var(--text-secondary);
      box-shadow: none;
      cursor: not-allowed;
    }
    
    .loading-icon {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .dialog-header {
        padding: 20px 16px 12px;
      }
      
      .dialog-content {
        padding: 20px 16px !important;
      }
      
      .user-form {
        min-width: auto;
        gap: 18px;
      }
      
      .dialog-actions {
        padding: 16px !important;
        margin: 0 -16px -16px !important;
        flex-direction: column;
        gap: 12px;
      }
      
      .cancel-btn, .save-btn {
        width: 100%;
        margin: 0;
      }
    }
  `]
})
export class EditUserDialogComponent {
  userForm: FormGroup;
  isLoading = false;
  originalUser: User;
  isCurrentUser = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; isCurrentUser: boolean }
  ) {
    this.originalUser = data.user;
    this.isCurrentUser = data.isCurrentUser;
    
    this.userForm = this.fb.group({
      name: [this.originalUser.name, [Validators.required, Validators.minLength(2)]],
      email: [this.originalUser.email, [Validators.required, Validators.email]],
      role: [this.originalUser.role, [Validators.required]],
      is_active: [this.originalUser.is_active ?? true]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  hasChanges(): boolean {
    const formValue = this.userForm.value;
    return (
      formValue.name !== this.originalUser.name ||
      formValue.email !== this.originalUser.email ||
      formValue.role !== this.originalUser.role ||
      formValue.is_active !== (this.originalUser.is_active ?? true)
    );
  }

  onSave(): void {
    if (this.userForm.valid && this.hasChanges()) {
      this.isLoading = true;
      
      const formValue = this.userForm.value;
      const updateData = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        is_active: formValue.is_active
      };

      this.apiService.put<User>(`/users/${this.originalUser.id}`, updateData).subscribe({
        next: (updatedUser) => {
          this.snackBar.open('User updated successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(updatedUser);
        },
        error: (error) => {
          console.error('Failed to update user:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to update user', 
            'Close', 
            { 
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          this.isLoading = false;
        }
      });
    } else if (!this.hasChanges()) {
      this.snackBar.open('No changes to save', 'Close', { duration: 3000 });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 5000 });
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'salesperson': return 'person';
      case 'technician': return 'build';
      default: return '';
    }
  }

  getRoleName(role: string): string {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'salesperson': return 'Salesperson';
      case 'technician': return 'Technician';
      default: return 'Select user role';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }
}