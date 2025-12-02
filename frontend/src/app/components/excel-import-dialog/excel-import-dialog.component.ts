import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';

export interface ImportResult {
  success_count: number;
  error_count: number;
  duplicate_count: number;
  updated_count: number;
  errors: string[];
  duplicates: string[];
  imported_devices: any[];
}

@Component({
  selector: 'app-excel-import-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>upload_file</mat-icon>
        </div>
        <div class="header-text">
          <h2>Import Inventory from Excel</h2>
          <p>Upload an Excel file to import multiple devices</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content>
      <div class="import-container">
        <!-- Sample Template Download -->
        <div class="template-section">
          <h3>Step 1: Download Template</h3>
          <p>Download the sample Excel template to ensure proper format</p>
          <button mat-stroked-button color="primary" (click)="downloadTemplate()" class="template-btn">
            <mat-icon>download</mat-icon>
            Download Sample Template
          </button>
        </div>

        <mat-divider></mat-divider>

        <!-- Duplicate Handling Options -->
        <div class="duplicate-section">
          <h3>Step 2: Duplicate Handling</h3>
          <p>Choose how to handle duplicate devices (same Name + Brand + Model)</p>
          <mat-radio-group [(ngModel)]="duplicateAction" class="duplicate-options">
            <mat-radio-button value="skip" class="duplicate-option">
              <div class="option-content">
                <strong>Skip Duplicates</strong>
                <span>Skip importing devices that already exist</span>
              </div>
            </mat-radio-button>
            <mat-radio-button value="update" class="duplicate-option">
              <div class="option-content">
                <strong>Update Existing</strong>
                <span>Update existing devices with new data</span>
              </div>
            </mat-radio-button>
            <mat-radio-button value="error" class="duplicate-option">
              <div class="option-content">
                <strong>Report as Error</strong>
                <span>Treat duplicates as import errors</span>
              </div>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-divider></mat-divider>

        <!-- File Upload Section -->
        <div class="upload-section">
          <h3>Step 3: Upload Your Excel File</h3>
          <div class="file-upload-container">
            <input type="file" 
                   #fileInput
                   class="file-input" 
                   accept=".xlsx,.xls"
                   (change)="onFileSelected($event)">
            <div class="upload-area" 
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 [class.drag-over]="isDragOver">
              <div *ngIf="!selectedFile" class="upload-placeholder">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p class="upload-text">Click to upload or drag and drop</p>
                <p class="upload-hint">Excel files only (.xlsx, .xls)</p>
              </div>
              <div *ngIf="selectedFile" class="file-preview">
                <mat-icon class="file-icon">description</mat-icon>
                <div class="file-info">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button type="button" 
                        mat-icon-button 
                        class="remove-file-btn"
                        (click)="removeFile($event)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
          <div *ngIf="fileError" class="error-message">
            {{ fileError }}
          </div>
        </div>

        <!-- Data Preview -->
        <div class="preview-section" *ngIf="previewData && previewData.length > 0">
          <h3>Step 4: Preview Data</h3>
          <p>Review the first {{ Math.min(previewData.length - 1, 5) }} rows of your data before importing</p>
          <div class="preview-table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <th *ngFor="let header of previewData[0]; trackBy: trackByIndex">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of previewData.slice(1, 6); trackBy: trackByIndex">
                  <td *ngFor="let cell of row; trackBy: trackByIndex">{{ cell || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="preview-actions">
            <button mat-stroked-button (click)="clearPreview()" class="clear-preview-btn">
              <mat-icon>clear</mat-icon>
              Clear Preview
            </button>
            <button mat-raised-button 
                    color="primary" 
                    (click)="onImport()" 
                    [disabled]="isImporting"
                    class="preview-import-btn">
              <mat-icon *ngIf="!isImporting">upload</mat-icon>
              <mat-icon *ngIf="isImporting" class="loading-icon">refresh</mat-icon>
              {{ isImporting ? 'Importing...' : 'Import Data' }}
            </button>
          </div>
        </div>

        <mat-divider *ngIf="previewData && previewData.length > 0"></mat-divider>

        <!-- Import Progress -->
        <div class="progress-section" *ngIf="isImporting">
          <h3>Import Progress</h3>
          <div class="progress-container">
            <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
            <p class="progress-text">Processing your file, please wait...</p>
          </div>
        </div>

        <mat-divider *ngIf="importResult"></mat-divider>

        <!-- Import Results -->
        <div class="results-section" *ngIf="importResult">
          <h3>Import Results</h3>
          <div class="result-summary">
            <div class="success-count" *ngIf="importResult.success_count > 0">
              <mat-icon>check_circle</mat-icon>
              <span>{{ importResult.success_count }} devices imported successfully</span>
            </div>
            <div class="updated-count" *ngIf="importResult.updated_count > 0">
              <mat-icon>update</mat-icon>
              <span>{{ importResult.updated_count }} devices updated</span>
            </div>
            <div class="duplicate-count" *ngIf="importResult.duplicate_count > 0">
              <mat-icon>content_copy</mat-icon>
              <span>{{ importResult.duplicate_count }} duplicates {{ duplicateAction === 'skip' ? 'skipped' : 'found' }}</span>
            </div>
            <div class="error-count" *ngIf="importResult.error_count > 0">
              <mat-icon>error</mat-icon>
              <span>{{ importResult.error_count }} errors encountered</span>
            </div>
          </div>
          
          <div class="duplicate-details" *ngIf="importResult.duplicates && importResult.duplicates.length > 0">
            <h4>Duplicates:</h4>
            <div class="duplicate-list">
              <div *ngFor="let duplicate of importResult.duplicates" class="duplicate-item">
                {{ duplicate }}
              </div>
            </div>
          </div>
          
          <div class="error-details" *ngIf="importResult.errors && importResult.errors.length > 0">
            <h4>Errors:</h4>
            <div class="error-list">
              <div *ngFor="let error of importResult.errors" class="error-item">
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        {{ importResult ? 'Close' : 'Cancel' }}
      </button>
      <button mat-stroked-button 
              [disabled]="!selectedFile || isImporting || !!previewData"
              (click)="previewFile()" 
              class="preview-btn"
              *ngIf="!importResult && !previewData">
        <mat-icon>preview</mat-icon>
        Preview Data
      </button>
      <button mat-flat-button 
              [disabled]="!selectedFile || isImporting"
              (click)="onImport()" 
              class="import-btn"
              *ngIf="!importResult && !previewData">
        <mat-icon *ngIf="!isImporting">upload</mat-icon>
        <mat-icon *ngIf="isImporting" class="loading-icon">refresh</mat-icon>
        {{ isImporting ? 'Importing...' : 'Import Devices' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 32px 32px 16px;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
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
    
    .import-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 550px;
    }
    
    .template-section, .duplicate-section, .upload-section, .preview-section, .progress-section, .results-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .template-section h3, .duplicate-section h3, .upload-section h3, .preview-section h3, .progress-section h3, .results-section h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .progress-text {
      margin: 0;
      color: #64748b;
      font-size: 14px;
      text-align: center;
    }
    
    .template-section p, .duplicate-section p, .upload-section p, .preview-section p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .preview-table-container {
      overflow-x: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
    }
    
    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    .preview-table th {
      background: #f8fafc;
      color: #374151;
      font-weight: 600;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      white-space: nowrap;
    }
    
    .preview-table th:last-child {
      border-right: none;
    }
    
    .preview-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      border-right: 1px solid #f3f4f6;
      color: #374151;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .preview-table td:last-child {
      border-right: none;
    }
    
    .preview-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .preview-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }
    
    .clear-preview-btn {
      color: #6b7280;
    }
    
    .preview-import-btn {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
    }
    
    .duplicate-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    
    .duplicate-option {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      transition: all 0.2s ease;
    }
    
    .duplicate-option:hover {
      border-color: #4caf50;
      background: #f0fff4;
    }
    
    .duplicate-option.mat-radio-checked {
      border-color: #4caf50;
      background: #f0fff4;
    }
    
    .option-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: 8px;
    }
    
    .option-content strong {
      font-weight: 600;
      color: #1f2937;
    }
    
    .option-content span {
      font-size: 12px;
      color: #6b7280;
    }
    
    .template-btn {
      align-self: flex-start;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .file-upload-container {
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
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .upload-area:hover {
      border-color: #4caf50;
      background: #f0fff4;
    }
    
    .upload-area.drag-over {
      border-color: #4caf50;
      background: #f0fff4;
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
      color: #9ca3af;
    }
    
    .upload-text {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #374151;
    }
    
    .upload-hint {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .file-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .file-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #4caf50;
    }
    
    .file-info {
      flex: 1;
    }
    
    .file-name {
      margin: 0 0 4px 0;
      font-weight: 500;
      color: #1f2937;
    }
    
    .file-size {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    
    .remove-file-btn {
      color: #ef4444;
    }
    
    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: 8px;
    }
    
    .result-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .success-count, .updated-count, .duplicate-count, .error-count {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
    }
    
    .success-count {
      background: #dcfce7;
      color: #166534;
    }
    
    .updated-count {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .duplicate-count {
      background: #fef3c7;
      color: #d97706;
    }
    
    .error-count {
      background: #fef2f2;
      color: #dc2626;
    }
    
    .duplicate-details, .error-details {
      margin-top: 16px;
    }
    
    .duplicate-details h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #d97706;
    }
    
    .error-details h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #dc2626;
    }
    
    .duplicate-list {
      background: #fef3c7;
      border-radius: 6px;
      padding: 12px;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .error-list {
      background: #fef2f2;
      border-radius: 6px;
      padding: 12px;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .duplicate-item {
      font-size: 12px;
      color: #d97706;
      margin-bottom: 4px;
      padding: 2px 0;
    }
    
    .error-item {
      font-size: 12px;
      color: #dc2626;
      margin-bottom: 4px;
      padding: 2px 0;
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
    
    .preview-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      border: 2px solid #4caf50;
      color: #4caf50;
      background: white;
      min-width: 150px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .preview-btn:hover:not(:disabled) {
      background: #4caf50;
      color: white;
    }
    
    .preview-btn:disabled {
      border-color: #e0e0e0;
      color: #9e9e9e;
      cursor: not-allowed;
    }
    
    .import-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      transition: all 0.3s ease;
      min-width: 150px;
      font-size: 16px;
      cursor: pointer;
    }
    
    .import-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
      transform: translateY(-1px);
    }
    
    .import-btn:disabled {
      background: #e0e0e0;
      color: #9e9e9e;
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
    
    mat-divider {
      margin: 16px 0;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .import-container {
        min-width: auto;
      }
      
      .dialog-actions {
        flex-direction: column;
        gap: 12px;
      }
      
      .cancel-btn, .import-btn {
        width: 100%;
      }
    }
  `]
})
export class ExcelImportDialogComponent {
  selectedFile: File | null = null;
  fileError: string | null = null;
  isDragOver = false;
  isImporting = false;
  importResult: ImportResult | null = null;
  duplicateAction: string = 'skip';
  previewData: any[][] | null = null;
  Math = Math;

  constructor(
    private dialogRef: MatDialogRef<ExcelImportDialogComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(this.importResult);
  }

  downloadTemplate(): void {
    // Create sample Excel data with the specified header structure
    const sampleData = [
      [
        'Manufacturer',
        'Model',
        'Category',
        'Sub Category',
        'Long Description',
        'Short Description',
        'Phase',
        'Cost Price (Unit Cost)',
        'Retail Price(MSRP)',
        'Markup(%)',
        'Discount(%)', 
        'Selling Price',
        'Supplier',
        'Taxable(True/False)',
        'Specifications',
        'Custom Field 1',
        'Custom Field 2',
        'Custom Field 3'
      ],
      [
        'Philips',
        'Hue White A19 E27',
        'Lighting',
        'Smart Bulbs',
        'Smart LED bulb with app control, voice assistant compatibility, and energy-efficient lighting solution for modern homes',
        'WiFi-enabled LED smart bulb',
        'Phase 1',
        '15.99',
        '29.99',
        '87.5',
        '10',
        '26.99',
        'Philips Lighting Distribution',
        'True',
        'LED Technology, 9W Power, 800 Lumens, 2700K Warm White, WiFi 802.11n, Dimming Support',
        'Living Room Installation',
        '2 Years Warranty',
        'Energy Star Certified'
      ],
      [
        'Ring',
        'Spotlight Cam Battery',
        'Security',
        'Surveillance Cameras',
        'Wireless HD security camera with built-in LED spotlight, motion-activated recording, and two-way audio communication',
        'Battery-powered security camera',
        'Phase 2', 
        '149.99',
        '249.99',
        '66.7',
        '20',
        '199.99',
        'Ring Security Solutions',
        'True',
        '1080p Full HD, Motion Detection, Night Vision IR, Two-Way Audio, Battery Life 6-12 months',
        'Outdoor Weatherproof',
        '1 Year Limited Warranty',
        'IP65 Weather Rating'
      ],
      [
        'Google Nest',
        'Learning Thermostat 3rd Gen',
        'HVAC',
        'Temperature Control',
        'Intelligent learning thermostat that adapts to your schedule, saves energy automatically, and provides remote temperature control',
        'WiFi programmable thermostat',
        'Phase 1',
        '199.99',
        '279.99',
        '40',
        '5',
        '265.99',
        'Google Nest Distribution',
        'False',
        'WiFi Connectivity, Auto-Schedule Learning, Energy History, Compatibility with 95% of systems',
        'HVAC System Compatible',
        '2 Years Manufacturer Warranty',
        'ENERGY STAR Certified'
      ]
    ];

    // Convert to CSV format for easy Excel import
    const csvContent = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Template downloaded successfully', '', { duration: 3000 });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
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
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.fileError = null;
    this.importResult = null;
    this.previewData = null;
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      this.fileError = 'Please select a valid Excel file (.xlsx, .xls) or CSV file';
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.fileError = 'File size must be less than 10MB';
      return;
    }
    
    this.selectedFile = file;
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = null;
    this.importResult = null;
    this.previewData = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByIndex(index: number): number {
    return index;
  }

  previewFile(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        if (this.selectedFile?.name.endsWith('.csv')) {
          this.previewData = this.parseCsvData(data);
        } else {
          // For Excel files, we'll use a simplified preview
          this.fileError = 'Excel preview not supported in browser. Please use CSV files for preview or import directly.';
          return;
        }
      } catch (error) {
        this.fileError = 'Failed to preview file. Please check the file format.';
        console.error('Preview error:', error);
      }
    };

    if (this.selectedFile.name.endsWith('.csv')) {
      reader.readAsText(this.selectedFile);
    } else {
      this.fileError = 'Preview is only available for CSV files. Please convert to CSV or import directly.';
    }
  }

  private parseCsvData(csvText: string): any[][] {
    const lines = csvText.split('\n');
    const result: any[][] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - handles basic cases
        const row = line.split(',').map(cell => 
          cell.trim().replace(/^"(.*)"$/, '$1')
        );
        result.push(row);
      }
    }
    
    return result;
  }

  clearPreview(): void {
    this.previewData = null;
  }

  onImport(): void {
    if (!this.selectedFile) return;

    this.isImporting = true;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('duplicate_action', this.duplicateAction);

    this.apiService.postFormData<ImportResult>('/devices/import-excel', formData).subscribe({
      next: (result) => {
        this.importResult = result;
        this.isImporting = false;
        
        // Show comprehensive success message
        const messages = [];
        if (result.success_count > 0) {
          messages.push(`${result.success_count} imported`);
        }
        if (result.updated_count > 0) {
          messages.push(`${result.updated_count} updated`);
        }
        if (result.duplicate_count > 0) {
          messages.push(`${result.duplicate_count} duplicates ${this.duplicateAction === 'skip' ? 'skipped' : 'handled'}`);
        }
        
        if (messages.length > 0) {
          this.snackBar.open(
            `Import complete: ${messages.join(', ')}`, 
            '', 
            { 
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
        }
        
        if (result.error_count > 0) {
          this.snackBar.open(
            `${result.error_count} errors encountered during import`, 
            '', 
            { 
              duration: 5000,
              panelClass: ['warning-snackbar']
            }
          );
        }
      },
      error: (error) => {
        console.error('Failed to import devices:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to import devices', 
          '', 
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
        this.isImporting = false;
      }
    });
  }
}