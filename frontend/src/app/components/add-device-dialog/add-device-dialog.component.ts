import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CurrencyService } from '../../services/currency.service';
import { CreateDeviceRequest, Device } from '../../models/device.model';

@Component({
  selector: 'app-add-device-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>devices</mat-icon>
        </div>
        <div class="header-text">
          <h2>{{ isEditMode ? 'Edit Device' : 'Add New Device' }}</h2>
          <p>{{ isEditMode ? 'Update device information' : 'Add a new device to your inventory' }}</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content>
      <form [formGroup]="deviceForm" class="device-form">
        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Manufacturer</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="manufacturer" 
                   placeholder="Manufacturer name (optional)">
          </div>

          <div class="form-field half-width">
            <label class="field-label">Device Name *</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="name" 
                   placeholder="Enter device name">
            <div *ngIf="deviceForm.get('name')?.hasError('required') && deviceForm.get('name')?.touched" 
                 class="error-message">
              Device name is required
            </div>
            <div *ngIf="deviceForm.get('name')?.hasError('minlength') && deviceForm.get('name')?.touched" 
                 class="error-message">
              Device name must be at least 2 characters long
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Category *</label>
            <select class="form-input" formControlName="category">
              <option value="">Select category</option>
              <option value="lighting">Lighting</option>
              <option value="security">Security</option>
              <option value="hvac">HVAC</option>
              <option value="entertainment">Entertainment</option>
              <option value="networking">Networking</option>
              <option value="sensors">Sensors</option>
              <option value="controllers">Controllers</option>
              <option value="other">Other</option>
            </select>
            <div *ngIf="deviceForm.get('category')?.hasError('required') && deviceForm.get('category')?.touched" 
                 class="error-message">
              Category is required
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Sub Category</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="sub_category" 
                   placeholder="Sub category (optional)">
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Brand *</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="brand" 
                   placeholder="Device brand">
            <div *ngIf="deviceForm.get('brand')?.hasError('required') && deviceForm.get('brand')?.touched" 
                 class="error-message">
              Brand is required
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Model *</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="model" 
                   placeholder="Model number">
            <div *ngIf="deviceForm.get('model')?.hasError('required') && deviceForm.get('model')?.touched" 
                 class="error-message">
              Model is required
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Phase</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="phase" 
                   placeholder="Phase (optional)">
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Description</label>
          <textarea class="form-input form-textarea" 
                    formControlName="description" 
                    rows="2" 
                    placeholder="Brief description of the device (optional)"></textarea>
        </div>

        <div class="form-field">
          <label class="field-label">Short Description</label>
          <textarea class="form-input form-textarea" 
                    formControlName="short_description" 
                    rows="2" 
                    placeholder="Short description (optional)"></textarea>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Cost Price *</label>
            <div class="price-input-wrapper">
              <span class="currency-prefix">{{ currentCurrencySymbol }}</span>
              <input type="number" 
                     class="form-input price-input" 
                     formControlName="cost_price" 
                     placeholder="0.00" 
                     step="0.01" 
                     min="0">
            </div>
            <div *ngIf="deviceForm.get('cost_price')?.hasError('required') && deviceForm.get('cost_price')?.touched" 
                 class="error-message">
              Cost price is required
            </div>
            <div *ngIf="deviceForm.get('cost_price')?.hasError('min') && deviceForm.get('cost_price')?.touched" 
                 class="error-message">
              Cost price must be positive
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Retail Price</label>
            <div class="price-input-wrapper">
              <span class="currency-prefix">{{ currentCurrencySymbol }}</span>
              <input type="number" 
                     class="form-input price-input" 
                     formControlName="retail_price" 
                     placeholder="0.00" 
                     step="0.01" 
                     min="0">
            </div>
            <div *ngIf="deviceForm.get('retail_price')?.hasError('min') && deviceForm.get('retail_price')?.touched" 
                 class="error-message">
              Retail price must be positive
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Markup (%)</label>
            <input type="number" 
                   class="form-input" 
                   formControlName="markup" 
                   placeholder="0.00" 
                   step="0.01" 
                   min="0" 
                   max="999.99">
            <div *ngIf="deviceForm.get('markup')?.hasError('min') && deviceForm.get('markup')?.touched" 
                 class="error-message">
              Markup must be positive
            </div>
            <div *ngIf="deviceForm.get('markup')?.hasError('max') && deviceForm.get('markup')?.touched" 
                 class="error-message">
              Markup cannot exceed 999.99%
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Discount (%)</label>
            <input type="number" 
                   class="form-input" 
                   formControlName="discount" 
                   placeholder="0.00" 
                   step="0.01" 
                   min="0" 
                   max="100">
            <div *ngIf="deviceForm.get('discount')?.hasError('min') && deviceForm.get('discount')?.touched" 
                 class="error-message">
              Discount must be positive
            </div>
            <div *ngIf="deviceForm.get('discount')?.hasError('max') && deviceForm.get('discount')?.touched" 
                 class="error-message">
              Discount cannot exceed 100%
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Selling Price (Auto-calculated)</label>
            <div class="price-input-wrapper">
              <span class="currency-prefix">{{ currentCurrencySymbol }}</span>
              <input type="number"
                     class="form-input price-input"
                     formControlName="selling_price"
                     placeholder="0.00"
                     step="0.01"
                     min="0"
                     readonly>
            </div>
            <div class="info-message">
              Calculated: Retail Price × (1 + Markup%) × (1 - Discount%)
            </div>
            <div *ngIf="deviceForm.get('selling_price')?.hasError('min') && deviceForm.get('selling_price')?.touched"
                 class="error-message">
              Selling price must be positive
            </div>
          </div>

          <div class="form-field half-width">
            <label class="field-label">Taxable</label>
            <div class="checkbox-wrapper">
              <input type="checkbox" 
                     id="is_taxable" 
                     class="form-checkbox" 
                     formControlName="is_taxable">
              <label for="is_taxable" class="checkbox-label">This device is taxable</label>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Supplier</label>
          <input type="text" 
                 class="form-input" 
                 formControlName="supplier" 
                 placeholder="Supplier name (optional)">
        </div>


        <div class="form-field">
          <label class="field-label">Specifications</label>
          <textarea class="form-input form-textarea" 
                    formControlName="specifications" 
                    rows="3" 
                    placeholder="Technical specifications and features (optional)"></textarea>
        </div>

        <div class="form-row">
          <div class="form-field half-width">
            <label class="field-label">Custom Field 1</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="custom_field_1" 
                   placeholder="Custom field 1 (optional)">
          </div>

          <div class="form-field half-width">
            <label class="field-label">Custom Field 2</label>
            <input type="text" 
                   class="form-input" 
                   formControlName="custom_field_2" 
                   placeholder="Custom field 2 (optional)">
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Custom Field 3</label>
          <input type="text" 
                 class="form-input" 
                 formControlName="custom_field_3" 
                 placeholder="Custom field 3 (optional)">
        </div>

        <div class="form-field">
          <label class="field-label">Device Image</label>
          <div class="image-upload-container">
            <input type="file" 
                   #fileInput
                   class="file-input" 
                   accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                   (change)="onImageSelected($event)">
            <div class="upload-area" 
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 [class.drag-over]="isDragOver">
              <div *ngIf="!selectedImage && !imagePreview" class="upload-placeholder">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p class="upload-text">Click to upload or drag and drop</p>
                <p class="upload-hint">PNG, JPG, GIF up to 5MB</p>
              </div>
              <div *ngIf="imagePreview" class="image-preview">
                <img [src]="imagePreview" alt="Device preview" class="preview-image">
                <div class="image-overlay">
                  <button type="button" 
                          mat-icon-button 
                          class="remove-image-btn"
                          (click)="removeImage($event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="imageError" class="error-message">
            {{ imageError }}
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        Cancel
      </button>
      <button mat-flat-button 
              [disabled]="deviceForm.invalid || isLoading"
              (click)="onSave()" 
              class="save-btn">
        {{ isEditMode ? 'Update Device' : 'Save Device' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 32px 32px 16px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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
    
    mat-dialog-content {
      padding: 32px !important;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .device-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 550px;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151 !important;
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
      border-color: #ff6b6b;
      box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
    }
    
    .form-input:hover {
      border-color: #9ca3af;
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 60px;
      font-family: inherit;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
    }
    
    .half-width {
      flex: 1;
    }
    
    .price-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .currency-prefix {
      position: absolute;
      left: 16px;
      color: #6b7280;
      font-weight: 500;
      z-index: 1;
      pointer-events: none;
    }
    
    .price-input {
      padding-left: 32px;
    }
    
    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: 4px;
    }

    .info-message {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
      font-style: italic;
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
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      transition: all 0.3s ease;
      min-width: 150px;
      font-size: 16px;
      cursor: pointer;
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
      transform: translateY(-1px);
    }
    
    .save-btn:disabled {
      background: #e0e0e0;
      color: #9e9e9e;
      box-shadow: none;
    }
    
    .loading-icon {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    
    .form-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .checkbox-label {
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }
    
    .image-upload-container {
      margin-top: 8px;
    }
    
    .file-input {
      display: none;
    }
    
    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
      position: relative;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .upload-area:hover {
      border-color: #ff6b6b;
      background: #fff5f5;
    }
    
    .upload-area.drag-over {
      border-color: #ff6b6b;
      background: #fff5f5;
      border-style: solid;
    }
    
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #9ca3af !important;
    }
    
    .upload-text {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #374151 !important;
    }
    
    .upload-hint {
      margin: 0;
      font-size: 14px;
      color: #6b7280 !important;
    }
    
    .image-preview {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .preview-image {
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .image-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .image-preview:hover .image-overlay {
      opacity: 1;
    }
    
    .remove-image-btn {
      color: white;
      width: 32px;
      height: 32px;
    }
    
    .remove-image-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .cancel-btn:hover {
      border-color: #ccc;
      background: #f8f9fa;
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
      transform: translateY(-1px);
    }
    
    .save-btn:disabled {
      background: #e0e0e0;
      color: #9e9e9e;
      box-shadow: none;
      cursor: not-allowed;
    }
    
    .loading-icon {
      animation: spin 1s linear infinite;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .dialog-header {
        padding: 20px 16px 12px;
        flex-direction: row;
        align-items: flex-start;
      }
      
      .header-content {
        gap: 12px;
      }
      
      .header-icon {
        width: 40px;
        height: 40px;
      }
      
      .header-text h2 {
        font-size: 20px;
      }
      
      .header-text p {
        font-size: 13px;
      }
      
      mat-dialog-content {
        padding: 20px 16px !important;
        max-height: 75vh;
      }
      
      .device-form {
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
      
      .form-input {
        padding: 14px 16px;
        font-size: 16px; /* Prevents zoom on iOS */
      }
      
      .price-input {
        padding: 14px 16px 14px 32px;
      }
      
      .field-label {
        font-size: 15px;
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
        height: 48px;
        border-radius: 24px;
      }
    }
    
    @media (max-width: 480px) {
      .dialog-header {
        padding: 16px 12px 10px;
      }
      
      .header-content {
        gap: 10px;
      }
      
      .header-icon {
        width: 36px;
        height: 36px;
      }
      
      .header-text h2 {
        font-size: 18px;
      }
      
      .header-text p {
        font-size: 12px;
      }
      
      mat-dialog-content {
        padding: 16px 12px !important;
      }
      
      .device-form {
        gap: 16px;
      }
      
      .form-input {
        padding: 12px 14px;
      }
      
      .price-input {
        padding: 12px 14px 12px 30px;
      }
      
      .dialog-actions {
        padding: 12px !important;
        margin: 0 -12px -12px !important;
      }
    }
  `]
})
export class AddDeviceDialogComponent implements OnInit, OnDestroy {
  deviceForm: FormGroup;
  isLoading = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  imageError: string | null = null;
  isDragOver = false;
  isEditMode = false;
  deviceToEdit: Device | null = null;
  currentCurrencySymbol = '$';
  private currencySubscription?: Subscription;
  private pricingSubscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddDeviceDialogComponent>,
    private apiService: ApiService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Check if this is edit mode
    if (this.data && this.data.isEdit && this.data.device) {
      this.isEditMode = true;
      this.deviceToEdit = this.data.device;
    }
    this.deviceForm = this.fb.group({
      manufacturer: [''],
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', [Validators.required]],
      sub_category: [''],
      brand: ['', [Validators.required]],
      model: ['', [Validators.required]],
      description: [''],
      short_description: [''],
      phase: [''],
      cost_price: [0, [Validators.required, Validators.min(0)]],
      retail_price: [0, [Validators.min(0)]],
      markup: [0, [Validators.min(0), Validators.max(999.99)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      selling_price: [0, [Validators.min(0)]], // Auto-calculated, no longer required
      supplier: [''],
      is_taxable: [true],
      specifications: [''],
      custom_field_1: [''],
      custom_field_2: [''],
      custom_field_3: ['']
    });

    // Populate form if in edit mode
    if (this.isEditMode && this.deviceToEdit) {
      this.populateFormForEdit();
    }
  }

  ngOnInit(): void {
    // Subscribe to currency changes
    this.currencySubscription = this.currencyService.getCurrentCurrency().subscribe(currency => {
      this.currentCurrencySymbol = currency.symbol;
    });

    // Subscribe to pricing field changes for automatic selling price calculation
    const retailPriceSub = this.deviceForm.get('retail_price')?.valueChanges.subscribe(() => {
      this.calculateSellingPrice();
    });
    const markupSub = this.deviceForm.get('markup')?.valueChanges.subscribe(() => {
      this.calculateSellingPrice();
    });
    const discountSub = this.deviceForm.get('discount')?.valueChanges.subscribe(() => {
      this.calculateSellingPrice();
    });

    if (retailPriceSub) this.pricingSubscriptions.push(retailPriceSub);
    if (markupSub) this.pricingSubscriptions.push(markupSub);
    if (discountSub) this.pricingSubscriptions.push(discountSub);

    // Calculate initial selling price
    this.calculateSellingPrice();
  }

  ngOnDestroy(): void {
    if (this.currencySubscription) {
      this.currencySubscription.unsubscribe();
    }
    // Unsubscribe from pricing subscriptions
    this.pricingSubscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Automatically calculates selling price based on retail price, markup, and discount
   * Formula: Selling Price = Retail Price × (1 + Markup%) × (1 - Discount%)
   */
  calculateSellingPrice(): void {
    const retailPrice = this.deviceForm.get('retail_price')?.value || 0;
    const markup = this.deviceForm.get('markup')?.value || 0;
    const discount = this.deviceForm.get('discount')?.value || 0;

    // Formula: Retail Price × (1 + Markup%) × (1 - Discount%)
    let sellingPrice = retailPrice * (1 + markup / 100) * (1 - discount / 100);

    // Round to 2 decimal places
    sellingPrice = Math.round(sellingPrice * 100) / 100;

    // Update form without triggering valueChanges to avoid infinite loop
    this.deviceForm.patchValue({ selling_price: sellingPrice }, { emitEvent: false });
  }

  populateFormForEdit(): void {
    if (!this.deviceToEdit) return;

    this.deviceForm.patchValue({
      manufacturer: this.deviceToEdit.manufacturer || '',
      name: this.deviceToEdit.name,
      category: this.deviceToEdit.category,
      sub_category: this.deviceToEdit.sub_category || '',
      brand: this.deviceToEdit.brand,
      model: this.deviceToEdit.model,
      description: this.deviceToEdit.description || '',
      short_description: this.deviceToEdit.short_description || '',
      phase: this.deviceToEdit.phase || '',
      cost_price: this.deviceToEdit.cost_price,
      retail_price: this.deviceToEdit.retail_price || 0,
      markup: this.deviceToEdit.markup || 0,
      discount: this.deviceToEdit.discount || 0,
      selling_price: this.deviceToEdit.selling_price,
      supplier: this.deviceToEdit.supplier || '',
      is_taxable: this.deviceToEdit.is_taxable !== undefined ? this.deviceToEdit.is_taxable : true,
      specifications: this.deviceToEdit.specifications || '',
      custom_field_1: this.deviceToEdit.custom_field_1 || '',
      custom_field_2: this.deviceToEdit.custom_field_2 || '',
      custom_field_3: this.deviceToEdit.custom_field_3 || ''
    });

    // Set existing image preview if available
    if (this.deviceToEdit.image_url) {
      this.imagePreview = this.deviceToEdit.image_url;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleImageFile(files[0]);
    }
  }

  private handleImageFile(file: File): void {
    this.imageError = null;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.imageError = 'Image size must be less than 5MB';
      return;
    }
    
    this.selectedImage = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedImage = null;
    this.imagePreview = null;
    this.imageError = null;
  }

  onSave(): void {
    if (this.deviceForm.valid) {
      this.isLoading = true;
      
      // Create FormData for file upload
      const formData = new FormData();
      const formValue = this.deviceForm.value;
      
      // Add all form fields to FormData
      Object.keys(formValue).forEach(key => {
        if (formValue[key] !== null && formValue[key] !== undefined) {
          formData.append(key, formValue[key]);
        }
      });
      
      // Add image if selected
      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }

      if (this.isEditMode && this.deviceToEdit) {
        // Update existing device
        this.apiService.putFormData<Device>(`/devices/${this.deviceToEdit.id}`, formData).subscribe({
          next: (device) => {
            this.snackBar.open('Device updated successfully', '', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close(device);
          },
          error: (error) => {
            console.error('Failed to update device:', error);
            this.snackBar.open(
              error.error?.message || 'Failed to update device', 
              '', 
              { 
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
            this.isLoading = false;
          }
        });
      } else {
        // Create new device
        this.apiService.postFormData<Device>('/devices', formData).subscribe({
          next: (device) => {
            this.snackBar.open('Device created successfully', '', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close(device);
          },
          error: (error) => {
            console.error('Failed to create device:', error);
            this.snackBar.open(
              error.error?.message || 'Failed to create device', 
              '', 
              { 
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      // Show alert instead of broken snackbar
      alert('Please fill in all required fields correctly');
      
      // Also try the snackbar without action button
      this.snackBar.open('Please fill in all required fields correctly', '', { duration: 5000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.deviceForm.controls).forEach(key => {
      const control = this.deviceForm.get(key);
      control?.markAsTouched();
    });
  }
}