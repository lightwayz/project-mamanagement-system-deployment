import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Device } from '../../models/device.model';
import { AddDeviceDialogComponent } from '../add-device-dialog/add-device-dialog.component';

@Component({
  selector: 'app-inventory',
  template: `
    <div class="inventory-container">
      <div class="header">
        <h2>Inventory</h2>
        <button mat-raised-button color="primary" (click)="addDevice()">
          <mat-icon>add</mat-icon>
          Add Device
        </button>
      </div>
      
      <mat-card>
        <mat-card-content>
          <mat-table [dataSource]="devices" class="mat-elevation-z8">
            <ng-container matColumnDef="image">
              <mat-header-cell *matHeaderCellDef>Image</mat-header-cell>
              <mat-cell *matCellDef="let device">
                <div class="device-image-cell">
                  <img *ngIf="device.image_url" 
                       [src]="device.image_url" 
                       [alt]="device.name"
                       class="device-thumbnail"
                       (error)="onImageError($event)">
                  <div *ngIf="!device.image_url" class="no-image-placeholder">
                    <mat-icon>image</mat-icon>
                  </div>
                </div>
              </mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
              <mat-cell *matCellDef="let device">{{device.name}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="category">
              <mat-header-cell *matHeaderCellDef>Category</mat-header-cell>
              <mat-cell *matCellDef="let device">{{device.category}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="brand">
              <mat-header-cell *matHeaderCellDef>Brand</mat-header-cell>
              <mat-cell *matCellDef="let device">{{device.brand}} {{device.model}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="selling_price">
              <mat-header-cell *matHeaderCellDef>Price</mat-header-cell>
              <mat-cell *matCellDef="let device">{{ device.selling_price | appCurrency }}</mat-cell>
            </ng-container>
            
            
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
              <mat-cell *matCellDef="let device">
                <button mat-icon-button (click)="editDevice(device)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteDevice(device)">
                  <mat-icon>delete</mat-icon>
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
    .inventory-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }
    .mat-table {
      width: 100%;
      overflow-x: auto;
    }
    .mat-cell, .mat-header-cell {
      padding: 12px 8px;
    }
    .mat-column-actions {
      width: 120px;
      text-align: center;
    }
    .mat-column-selling_price {
      text-align: right;
      width: 100px;
    }
    
    .device-image-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 50px;
    }
    
    .device-thumbnail {
      width: 50px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    
    .no-image-placeholder {
      width: 50px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }
    
    .no-image-placeholder mat-icon {
      color: #9e9e9e;
      font-size: 20px;
    }
    
    .mat-column-image {
      width: 80px;
      text-align: center;
    }
    
    /* Mobile responsive table */
    @media (max-width: 768px) {
      .inventory-container {
        padding: 16px;
      }
      
      .header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .header h2 {
        font-size: 20px;
        text-align: center;
      }
      
      .header button {
        width: 100%;
        height: 48px;
        border-radius: 24px;
        font-size: 16px;
      }
      
      mat-card {
        margin: 0 -8px;
        border-radius: 12px;
      }
      
      .mat-table {
        font-size: 14px;
      }
      
      .mat-cell, .mat-header-cell {
        padding: 8px 4px;
        font-size: 12px;
      }
      
      .mat-header-cell {
        font-weight: 600;
        background-color: #f8f9fa;
      }
      
      .mat-column-image {
        width: 10%;
        min-width: 60px;
      }
      
      .mat-column-name {
        width: 20%;
        min-width: 100px;
      }
      
      .mat-column-category {
        width: 15%;
        min-width: 80px;
      }
      
      .mat-column-brand {
        width: 20%;
        min-width: 80px;
      }
      
      .mat-column-selling_price {
        width: 20%;
        min-width: 70px;
        text-align: right;
      }
      
      .mat-column-actions {
        width: 5%;
        min-width: 60px;
        text-align: center;
      }
      
      
      .mat-icon-button {
        width: 32px;
        height: 32px;
        line-height: 32px;
      }
      
      .mat-icon-button mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    @media (max-width: 480px) {
      .inventory-container {
        padding: 12px;
      }
      
      .header h2 {
        font-size: 18px;
      }
      
      .mat-table {
        font-size: 12px;
      }
      
      .mat-cell, .mat-header-cell {
        padding: 6px 2px;
        font-size: 11px;
      }
      
      .mat-column-image {
        min-width: 50px;
      }
      
      .mat-column-name {
        min-width: 80px;
      }
      
      .mat-column-category {
        min-width: 60px;
      }
      
      .mat-column-brand {
        min-width: 70px;
      }
      
      .mat-column-selling_price {
        min-width: 60px;
      }
      
      .mat-column-actions {
        min-width: 50px;
      }
      
      .device-thumbnail {
        width: 35px;
        height: 30px;
      }
      
      .no-image-placeholder {
        width: 35px;
        height: 30px;
      }
      
      .no-image-placeholder mat-icon {
        font-size: 16px;
      }
      
      
      .mat-icon-button {
        width: 28px;
        height: 28px;
        line-height: 28px;
      }
      
      .mat-icon-button mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  devices: Device[] = [];
  displayedColumns: string[] = ['image', 'name', 'category', 'brand', 'selling_price', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.apiService.get<any>('/devices').subscribe({
      next: (response) => {
        // Handle both direct array and wrapped response formats
        this.devices = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error) => {
        console.error('Failed to load devices:', error);
        this.snackBar.open('Failed to load devices', 'Close', { duration: 3000 });
      }
    });
  }

  addDevice(): void {
    const dialogRef = this.dialog.open(AddDeviceDialogComponent, {
      width: '650px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDevices(); // Refresh the device list
      }
    });
  }

  editDevice(device: Device): void {
    const dialogRef = this.dialog.open(AddDeviceDialogComponent, {
      width: '650px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container',
      data: { device: device, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDevices(); // Refresh the device list
      }
    });
  }

  deleteDevice(device: Device): void {
    const confirmation = confirm(`Are you sure you want to delete "${device.name}"?\n\nThis action cannot be undone.`);
    
    if (confirmation) {
      this.apiService.delete(`/devices/${device.id}`).subscribe({
        next: (response) => {
          this.snackBar.open('Device deleted successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDevices(); // Refresh the device list
        },
        error: (error) => {
          console.error('Failed to delete device:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to delete device', 
            'Close', 
            { 
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  onImageError(event: any): void {
    // Hide broken image and show placeholder
    event.target.style.display = 'none';
  }
}