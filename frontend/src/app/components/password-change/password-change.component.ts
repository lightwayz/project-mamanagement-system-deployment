import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

export interface PasswordChangeData {
  userId: number;
  userName: string;
  isAdminReset: boolean;
}

@Component({
  selector: 'app-password-change',
  template: `
    <div class="password-change-container">
      <h2 mat-dialog-title>
        {{ data.isAdminReset ? 'Reset Password for ' + data.userName : 'Change Your Password' }}
      </h2>
      
      <mat-dialog-content>
        <div class="form-container">
          <!-- Step 1: Password Form -->
          <div *ngIf="currentStep === 1" class="step-content">
            <form [formGroup]="passwordForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ data.isAdminReset ? 'New Password' : 'Current Password' }}</mat-label>
                <input 
                  matInput 
                  type="password" 
                  formControlName="{{ data.isAdminReset ? 'new_password' : 'current_password' }}"
                  [type]="hideCurrentPassword ? 'password' : 'text'">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hideCurrentPassword = !hideCurrentPassword"
                  type="button">
                  <mat-icon>{{ hideCurrentPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get(data.isAdminReset ? 'new_password' : 'current_password')?.hasError('required')">
                  This field is required
                </mat-error>
                <mat-error *ngIf="passwordForm.get(data.isAdminReset ? 'new_password' : 'current_password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" *ngIf="!data.isAdminReset">
                <mat-label>New Password</mat-label>
                <input 
                  matInput 
                  type="password" 
                  formControlName="new_password"
                  [type]="hideNewPassword ? 'password' : 'text'">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hideNewPassword = !hideNewPassword"
                  type="button">
                  <mat-icon>{{ hideNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('new_password')?.hasError('required')">
                  New password is required
                </mat-error>
                <mat-error *ngIf="passwordForm.get('new_password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input 
                  matInput 
                  type="password" 
                  formControlName="new_password_confirmation"
                  [type]="hideConfirmPassword ? 'password' : 'text'">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                  type="button">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('new_password_confirmation')?.hasError('required')">
                  Please confirm your new password
                </mat-error>
                <mat-error *ngIf="passwordForm.get('new_password_confirmation')?.hasError('mismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>
            </form>
          </div>

          <!-- Step 2: OTP Verification -->
          <div *ngIf="currentStep === 2" class="step-content">
            <div class="otp-info">
              <mat-icon class="otp-icon">mail_outline</mat-icon>
              <h3>Email Verification Required</h3>
              <p>We've sent a 6-digit verification code to your email address.</p>
              <p class="otp-details">
                Code expires in <strong>{{ otpExpiryMinutes }} minutes</strong> •
                <strong>{{ remainingAttempts }}</strong> attempts remaining
              </p>
            </div>

            <form [formGroup]="otpForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Enter 6-digit verification code</mat-label>
                <input 
                  matInput 
                  formControlName="otp"
                  maxlength="6"
                  (input)="onOtpInput($event)"
                  placeholder="000000"
                  class="otp-input">
                <mat-error *ngIf="otpForm.get('otp')?.hasError('required')">
                  Verification code is required
                </mat-error>
                <mat-error *ngIf="otpForm.get('otp')?.hasError('pattern')">
                  Please enter a valid 6-digit code
                </mat-error>
              </mat-form-field>
            </form>

            <div class="otp-actions">
              <button 
                mat-button 
                (click)="resendOTP()" 
                [disabled]="isResendingOTP || resendCooldown > 0">
                {{ resendCooldown > 0 ? 'Resend in ' + resendCooldown + 's' : 'Resend Code' }}
              </button>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button 
          mat-button 
          *ngIf="currentStep === 2" 
          (click)="goBackToStep1()">
          Back
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!canProceed() || isLoading"
          (click)="onNext()">
          <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
          {{ currentStep === 1 ? 'Send Verification Code' : 'Change Password' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .password-change-container {
      min-width: 400px;
      max-width: 500px;
    }
    
    .form-container {
      padding: 16px 0;
    }
    
    .step-content {
      min-height: 200px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .otp-info {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .otp-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
      margin-bottom: 16px;
    }
    
    .otp-info h3 {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .otp-info p {
      margin: 4px 0;
      color: #666;
    }
    
    .otp-details {
      font-size: 14px;
      color: #888;
    }
    
    .otp-input {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 8px;
    }
    
    .otp-actions {
      text-align: center;
      margin-top: 16px;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
    }
    
    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class PasswordChangeComponent implements OnInit {
  passwordForm: FormGroup;
  otpForm: FormGroup;
  currentStep = 1;
  isLoading = false;
  isResendingOTP = false;
  otpExpiryMinutes = 10;
  remainingAttempts = 3;
  resendCooldown = 0;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PasswordChangeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordChangeData
  ) {
    this.passwordForm = this.createPasswordForm();
    this.otpForm = this.createOtpForm();
  }

  ngOnInit(): void {
    // Auto-focus on first field
    setTimeout(() => {
      const firstInput = document.querySelector('input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  private createPasswordForm(): FormGroup {
    const baseForm: any = {
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password_confirmation: ['', [Validators.required]]
    };

    if (!this.data.isAdminReset) {
      baseForm.current_password = ['', [Validators.required, Validators.minLength(6)]];
    }

    const form = this.fb.group(baseForm);

    // Add custom validator for password confirmation
    form.setValidators(this.passwordMatchValidator);

    return form;
  }

  private createOtpForm(): FormGroup {
    return this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private passwordMatchValidator(group: any) {
    const newPassword = group.get('new_password')?.value;
    const confirmPassword = group.get('new_password_confirmation')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      group.get('new_password_confirmation')?.setErrors({ mismatch: true });
    } else {
      const confirmControl = group.get('new_password_confirmation');
      if (confirmControl?.hasError('mismatch')) {
        confirmControl.setErrors(null);
      }
    }
    
    return null;
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return this.passwordForm.valid;
    } else {
      return this.otpForm.valid;
    }
  }

  onNext(): void {
    if (this.currentStep === 1) {
      this.requestOTP();
    } else {
      this.changePassword();
    }
  }

  requestOTP(): void {
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const action = this.data.isAdminReset ? 'admin_reset' : 'self_change';

    this.apiService.post('/users/request-password-change-otp', {
      user_id: this.data.userId,
      action: action
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.currentStep = 2;
        this.otpExpiryMinutes = response.expires_in_minutes || 10;
        this.remainingAttempts = response.remaining_attempts || 3;
        this.snackBar.open('Verification code sent to your email', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // For testing - show OTP in console
        if (response.otp) {
          console.log('Test OTP:', response.otp);
          this.snackBar.open(`Test OTP: ${response.otp}`, 'Close', {
            duration: 10000,
            panelClass: ['info-snackbar']
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(error.error?.message || 'Failed to send verification code', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  changePassword(): void {
    if (!this.otpForm.valid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const action = this.data.isAdminReset ? 'admin_reset' : 'self_change';
    
    const requestData: any = {
      user_id: this.data.userId,
      new_password: this.passwordForm.get('new_password')?.value,
      new_password_confirmation: this.passwordForm.get('new_password_confirmation')?.value,
      otp: this.otpForm.get('otp')?.value,
      action: action
    };

    if (!this.data.isAdminReset) {
      requestData.current_password = this.passwordForm.get('current_password')?.value;
    }

    this.apiService.post('/users/change-password', requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open(response.message, 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.remaining_attempts !== undefined) {
          this.remainingAttempts = error.error.remaining_attempts;
        }
        this.snackBar.open(error.error?.message || 'Failed to change password', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  resendOTP(): void {
    this.isResendingOTP = true;
    this.resendCooldown = 60; // 60 seconds cooldown
    
    // Start cooldown timer
    const timer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(timer);
        this.isResendingOTP = false;
      }
    }, 1000);

    this.requestOTP();
  }

  goBackToStep1(): void {
    this.currentStep = 1;
    this.otpForm.reset();
  }

  onOtpInput(event: any): void {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    event.target.value = value;
    this.otpForm.get('otp')?.setValue(value);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}