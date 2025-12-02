import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-edit-client-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>edit</mat-icon>
        </div>
        <div class="header-text">
          <h2>Edit Client</h2>
          <p>Update client profile information</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="clientForm" class="client-form">
        <div class="form-field">
          <label class="field-label">Full Name *</label>
          <input type="text" 
                 class="form-input" 
                 formControlName="name" 
                 placeholder="Enter client's full name">
          <div *ngIf="clientForm.get('name')?.hasError('required') && clientForm.get('name')?.touched" 
               class="error-message">
            Name is required
          </div>
          <div *ngIf="clientForm.get('name')?.hasError('minlength') && clientForm.get('name')?.touched" 
               class="error-message">
            Name must be at least 2 characters long
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Email Address *</label>
            <input type="email" 
                   class="form-input" 
                   formControlName="email" 
                   placeholder="client@example.com">
            <div *ngIf="clientForm.get('email')?.hasError('required') && clientForm.get('email')?.touched" 
                 class="error-message">
              Email is required
            </div>
            <div *ngIf="clientForm.get('email')?.hasError('email') && clientForm.get('email')?.touched" 
                 class="error-message">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Phone Number *</label>
            <input type="tel"
                   class="form-input"
                   formControlName="phone"
                   placeholder="e.g. +234 803 123 4567 or 08012345678">
            <div *ngIf="clientForm.get('phone')?.hasError('required') && clientForm.get('phone')?.touched"
                 class="error-message">
              Phone number is required
            </div>
            <div *ngIf="clientForm.get('phone')?.hasError('phoneInvalid') && clientForm.get('phone')?.touched"
                 class="error-message">
              Phone number must be 7-15 digits (international format supported)
            </div>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Address *</label>
          <textarea class="form-input form-textarea" 
                    formControlName="address" 
                    rows="3" 
                    placeholder="Full address including city, state, zip"></textarea>
          <div *ngIf="clientForm.get('address')?.hasError('required') && clientForm.get('address')?.touched" 
               class="error-message">
            Address is required
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Company</label>
          <input type="text" 
                 class="form-input" 
                 formControlName="company" 
                 placeholder="Company name (optional)">
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea class="form-input form-textarea" 
                    formControlName="notes" 
                    rows="3" 
                    placeholder="Additional notes about the client (optional)"></textarea>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        Cancel
      </button>
      <button mat-flat-button 
              [disabled]="clientForm.invalid || isLoading"
              (click)="onSave()" 
              class="save-btn">
        {{isLoading ? 'Updating...' : 'Update Client'}}
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
    
    .client-form {
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
      color: #374151;
      margin-bottom: 4px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #374151;
      background-color: #ffffff;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }
    
    .form-input::placeholder {
      color: #9ca3af;
    }
    
    .form-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-input:hover {
      border-color: #9ca3af;
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
    }
    
    .half-width {
      flex: 1;
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
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      gap: 16px;
    }
    
    .cancel-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      border: 2px solid #e0e0e0;
      color: #666;
      background: white;
      min-width: 120px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .cancel-btn:hover {
      background-color: #f5f5f5;
      border-color: #ccc;
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
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      transform: translateY(-1px);
    }
    
    .save-btn:disabled {
      background: #e0e0e0;
      color: #9e9e9e;
      box-shadow: none;
      cursor: not-allowed;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .client-form {
        min-width: auto;
        gap: 18px;
      }
      
      .form-row {
        flex-direction: column;
        gap: 16px;
      }
      
      .half-width {
        width: 100%;
      }
      
      .dialog-actions {
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
export class EditClientDialogComponent {
  clientForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditClientDialogComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { client: Client }
  ) {
    this.clientForm = this.fb.group({
      name: [data.client.name || '', [Validators.required, Validators.minLength(2)]],
      email: [data.client.email || '', [Validators.required, Validators.email]],
      phone: [data.client.phone || '', [Validators.required, this.phoneValidator]],
      address: [data.client.address || '', [Validators.required]],
      company: [data.client.company || ''],
      notes: [data.client.notes || '']
    });
  }

  // Custom phone validator for international numbers (E.164 standard)
  phoneValidator(control: any) {
    if (!control.value) {
      return null; // Let the required validator handle empty values
    }

    // Remove spaces, dashes, and parentheses but keep the + sign
    const cleanedPhone = control.value.replace(/[\s\-\(\)]/g, '');

    // Check for valid international phone format:
    // - Optional + at the start
    // - 7-15 digits (E.164 standard)
    const internationalPhoneRegex = /^\+?[0-9]{7,15}$/;

    if (internationalPhoneRegex.test(cleanedPhone)) {
      return null; // Valid
    }

    return { phoneInvalid: true }; // Invalid
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.clientForm.valid) {
      this.isLoading = true;
      const clientData: any = { ...this.clientForm.value };

      // Clean phone number - remove spaces, dashes, parentheses but keep + and digits
      if (clientData.phone) {
        clientData.phone = clientData.phone.replace(/[\s\-\(\)]/g, '');
      }

      this.apiService.put(`/clients/${this.data.client.id}`, clientData).subscribe({
        next: (response) => {
          this.snackBar.open('Client updated successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Failed to update client:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to update client', 
            'Close', 
            { 
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fix all validation errors', 'Close', { duration: 5000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      control?.markAsTouched();
    });
  }
}