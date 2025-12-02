import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService, Currency } from '../../services/currency.service';
import { PasswordChangeComponent } from '../password-change/password-change.component';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-container">
      <h2>System Settings</h2>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>Company Information</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Company Name</mat-label>
                <input matInput formControlName="company_name">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency" (selectionChange)="onCurrencyChange($event.value)">
                  <mat-option *ngFor="let currency of availableCurrencies" [value]="currency.code">
                    {{ currency.code }} - {{ currency.name }} ({{ currency.symbol }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Tax Rate (%)</mat-label>
                <input matInput type="number" formControlName="tax_rate">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Default Labor Rate</mat-label>
                <input matInput type="number" formControlName="default_labor_rate">
              </mat-form-field>
            </div>

            <div class="logo-upload-section" *ngIf="isAdmin">
              <h4>
                <mat-icon>image</mat-icon>
                Default Company Logo
              </h4>
              <p class="section-description">Upload a default company logo to be used in all project PDF proposals</p>

              <div class="logo-upload-container">
                <input type="file"
                       accept="image/jpeg,image/jpg,image/png,image/gif"
                       (change)="onDefaultLogoSelect($event)"
                       #defaultLogoInput
                       style="display: none">

                <div class="upload-actions">
                  <button type="button"
                          mat-stroked-button
                          (click)="defaultLogoInput.click()"
                          class="upload-btn">
                    <mat-icon>upload</mat-icon>
                    Choose Logo
                  </button>

                  <button type="button"
                          *ngIf="defaultLogoFile"
                          mat-raised-button
                          color="primary"
                          (click)="uploadDefaultLogo()"
                          class="upload-confirm-btn">
                    <mat-icon>cloud_upload</mat-icon>
                    Upload Logo
                  </button>

                  <button type="button"
                          *ngIf="defaultLogoFile"
                          mat-stroked-button
                          color="warn"
                          (click)="cancelLogoSelection()">
                    Cancel
                  </button>

                  <button type="button"
                          *ngIf="currentLogoPath && !defaultLogoFile"
                          mat-stroked-button
                          color="warn"
                          (click)="removeDefaultLogo()">
                    <mat-icon>delete</mat-icon>
                    Remove Current Logo
                  </button>
                </div>

                <div *ngIf="defaultLogoPreview" class="logo-preview">
                  <img [src]="defaultLogoPreview" alt="Default Logo Preview">
                  <div class="preview-label">Preview</div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="!settingsForm.valid">
                Save Settings
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>Account Settings</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="account-info">
            <div class="user-info">
              <h3>{{ currentUser?.name }}</h3>
              <p>{{ currentUser?.email }}</p>
              <p class="role-badge">{{ currentUser?.role | titlecase }}</p>
            </div>
            
            <div class="password-section">
              <h4>Password & Security</h4>
              <p>Keep your account secure by using a strong password.</p>
              <button 
                mat-raised-button 
                color="primary" 
                (click)="openPasswordChangeDialog()">
                <mat-icon>lock</mat-icon>
                Change Password
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="isAdmin">
        <mat-card-header>
          <mat-card-title>Email Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="emailForm" (ngSubmit)="saveEmailSettings()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>SMTP Host</mat-label>
                <input matInput formControlName="smtp_host">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>SMTP Port</mat-label>
                <input matInput type="number" formControlName="smtp_port">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Username</mat-label>
                <input matInput formControlName="smtp_username">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="smtp_password">
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button mat-button color="accent" type="button" (click)="testEmailConnection()">
                Test Connection
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="!emailForm.valid">
                Save Email Settings
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
    }
    .settings-container h2 {
      color: var(--text-primary) !important;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
    }
    .half-width {
      width: 50%;
    }
    .quarter-width {
      width: 24%;
    }
    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
    }
    mat-card {
      margin-bottom: 24px;
    }
    .account-info {
      padding: 16px 0;
    }
    .user-info {
      margin-bottom: 32px;
    }
    .user-info h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: var(--text-primary) !important;
    }
    .user-info p {
      margin: 4px 0;
      color: var(--text-secondary) !important;
    }
    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #e3f2fd;
      color: #1976d2;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      margin-top: 8px;
    }
    :host-context(.dark-theme) .role-badge {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }
    .password-section h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: var(--text-primary) !important;
    }
    .password-section p {
      margin: 0 0 16px 0;
      color: var(--text-secondary) !important;
    }
    .password-section button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Logo Upload Section Styles */
    .logo-upload-section {
      margin-top: 32px;
      padding: 24px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .logo-upload-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .logo-upload-section h4 mat-icon {
      color: #20bf6b;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .section-description {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0 0 20px 0;
    }

    .logo-upload-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: 2px dashed #20bf6b;
      color: #20bf6b;
      font-weight: 500;
    }

    .upload-btn:hover {
      background: rgba(32, 191, 107, 0.1);
      border-color: #01a3a4;
    }

    .upload-confirm-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .logo-preview {
      position: relative;
      width: 250px;
      padding: 16px;
      background: white;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .logo-preview img {
      max-width: 100%;
      max-height: 150px;
      object-fit: contain;
    }

    .preview-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    :host-context(.dark-theme) .logo-preview {
      background: var(--surface-color);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 12px;
      }

      .half-width, .quarter-width {
        width: 100%;
      }
    }

    /* CRITICAL FIX: Currency dropdown dark theme - Surgical approach with ::ng-deep */
    ::ng-deep :host-context(.dark-theme) {
      /* Force transparent on ALL mat-form-fields in settings */
      .settings-container {
        mat-form-field,
        .mat-form-field {
          background-color: transparent !important;

          &.mat-form-field-appearance-outline {
            background-color: transparent !important;
            background: transparent !important;
          }
        }

        /* Target all possible background-holding elements */
        .mat-form-field-wrapper,
        .mat-form-field-flex,
        .mat-form-field-infix {
          background-color: transparent !important;
        }

        /* Extra specificity for outline appearance */
        .mat-form-field-appearance-outline {
          background-color: transparent !important;

          .mat-form-field-wrapper,
          .mat-form-field-flex,
          .mat-form-field-infix,
          .mat-form-field-outline {
            background-color: transparent !important;
          }
        }

        /* Ensure select value text is white */
        .mat-select-value,
        .mat-select-value-text,
        .mat-select-trigger {
          color: rgba(255, 255, 255, 0.95) !important;
          background-color: transparent !important;
        }

        /* Nuclear option: Force ALL children transparent */
        mat-form-field * {
          background-color: transparent !important;
        }
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  emailForm!: FormGroup;
  currentUser: User | null = null;
  isAdmin = false;

  // Currency properties for basic dropdown
  availableCurrencies: Currency[] = [];

  // Logo upload properties
  defaultLogoFile: File | null = null;
  defaultLogoPreview: string | null = null;
  currentLogoPath: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.settingsForm = this.formBuilder.group({
      company_name: ['', Validators.required],
      currency: ['USD', Validators.required],
      tax_rate: [0, [Validators.required, Validators.min(0)]],
      default_labor_rate: [0, [Validators.required, Validators.min(0)]]
    });

    this.emailForm = this.formBuilder.group({
      smtp_host: ['mail.hometronix.com.ng', Validators.required],
      smtp_port: [587, [Validators.required, Validators.min(1)]],
      smtp_username: ['noreply@hometronix.com.ng', Validators.required],
      smtp_password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'admin';
    this.loadSettings();
    this.loadAvailableCurrencies();
  }

  private loadAvailableCurrencies(): void {
    // Load available currencies for dropdown
    this.currencyService.getAvailableCurrencies().subscribe(currencies => {
      this.availableCurrencies = currencies;
    });
  }

  loadSettings(): void {
    this.apiService.get<any>('/settings').subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.emailForm.patchValue(settings);
        this.currentLogoPath = settings.default_company_logo_path;

        // Show preview if logo exists
        if (this.currentLogoPath) {
          // Remove /api from base URL and add /storage path
          const baseUrl = this.apiService.getBaseUrl().replace('/api', '');
          this.defaultLogoPreview = `${baseUrl}/storage/${this.currentLogoPath}`;
        }
      },
      error: (error) => {
        console.error('Failed to load settings:', error);
        // Error interceptor will handle user-friendly message display
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.apiService.put('/settings', this.settingsForm.value).subscribe({
        next: (response) => {
          this.snackBar.open('Settings saved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
          // Error interceptor will handle user-friendly message display
        }
      });
    }
  }

  saveEmailSettings(): void {
    if (this.emailForm.valid) {
      this.apiService.put('/settings', this.emailForm.value).subscribe({
        next: (response) => {
          this.snackBar.open('Email settings saved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Failed to save email settings:', error);
          // Error interceptor will handle user-friendly message display
        }
      });
    }
  }

  testEmailConnection(): void {
    if (!this.emailForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.apiService.post('/settings/test-email-connection', this.emailForm.value).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(response.message || 'Email connection test successful', 'Close', { 
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open(response.message || 'Email connection test failed', 'Close', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Email connection test failed:', error);
        const errorMessage = error.error?.message || error.error?.error || 'Email connection test failed';
        this.snackBar.open(errorMessage, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  openPasswordChangeDialog(): void {
    if (!this.currentUser) {
      this.snackBar.open('User information not available', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PasswordChangeComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        isAdminReset: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Password changed successfully', 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  // Currency selection handler
  onCurrencyChange(currencyCode: string): void {
    this.currencyService.setCurrentCurrency(currencyCode);
    this.snackBar.open(`Currency changed to ${currencyCode}`, 'Close', { duration: 3000 });
  }

  // Default logo upload methods
  onDefaultLogoSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      if (file.size > 2048000) { // 2MB limit
        this.snackBar.open('Logo file size must be less than 2MB', 'Close', { duration: 3000 });
        return;
      }

      this.defaultLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.defaultLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, or GIF)', 'Close', { duration: 3000 });
    }
  }

  uploadDefaultLogo(): void {
    if (!this.defaultLogoFile) {
      this.snackBar.open('Please select a logo file first', 'Close', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('logo', this.defaultLogoFile);

    this.apiService.post<any>('/settings/upload-default-logo', formData).subscribe({
      next: (response) => {
        this.currentLogoPath = response.logo_path;
        this.defaultLogoFile = null;
        this.snackBar.open('Default company logo uploaded successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Failed to upload logo:', error);
        this.snackBar.open('Failed to upload logo', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  removeDefaultLogo(): void {
    if (confirm('Are you sure you want to remove the default company logo?')) {
      this.apiService.delete('/settings/delete-default-logo').subscribe({
        next: () => {
          this.defaultLogoPreview = null;
          this.currentLogoPath = null;
          this.snackBar.open('Default company logo removed successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Failed to remove logo:', error);
          this.snackBar.open('Failed to remove logo', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancelLogoSelection(): void {
    this.defaultLogoFile = null;
    this.defaultLogoPreview = null;
  }
}