import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ExportDialogData {
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-export-dialog',
  template: `
    <div class="export-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <div mat-dialog-content>
        <p class="dialog-subtitle">{{ data.subtitle }}</p>
        
        <mat-form-field appearance="outline" class="format-select">
          <mat-label>Export Format</mat-label>
          <mat-select [(ngModel)]="selectedFormat">
            <mat-option value="pdf">PDF Document</mat-option>
            <mat-option value="excel">Excel Spreadsheet</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onExport()">
          <mat-icon>download</mat-icon>
          Export
        </button>
      </div>
    </div>
  `,
  styles: [`
    .export-dialog {
      width: 100%;
      max-width: 400px;
    }
    
    .dialog-subtitle {
      color: var(--text-secondary) !important;
      margin-bottom: 24px;
    }
    
    .format-select {
      width: 100%;
      margin-bottom: 16px;
    }
    
    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class ExportDialogComponent {
  selectedFormat: 'pdf' | 'excel' = 'excel';

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onExport(): void {
    this.dialogRef.close(this.selectedFormat);
  }
}