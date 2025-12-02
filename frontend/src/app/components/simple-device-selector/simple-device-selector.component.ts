import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-simple-device-selector',
  template: `
    <div class="dialog-header">
      <h2>Add Devices to Project</h2>
      <button mat-icon-button (click)="onCancel()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <p>This is a simplified device selector dialog.</p>
      <p>Project ID: {{ data.projectId }}</p>

      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading devices...</p>
      </div>

      <div *ngIf="!isLoading && devices.length > 0" class="devices-list">
        <h3>Available Devices ({{ devices.length }})</h3>
        <div class="device-grid">
          <mat-card *ngFor="let device of devices" class="device-card"
                    [class.selected]="isSelected(device)"
                    (click)="toggleDevice(device)">
            <mat-card-content>
              <h4>{{ device.name }}</h4>
              <p>{{ device.brand }} {{ device.model }}</p>
              <p class="price">{{ formatCurrency(device.selling_price) }}</p>
              <mat-icon *ngIf="isSelected(device)" class="check-icon">check_circle</mat-icon>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div *ngIf="selectedDevices.length > 0" class="selected-summary">
        <h3>Selected Devices ({{ selectedDevices.length }})</h3>
        <div class="selected-list">
          <div *ngFor="let device of selectedDevices" class="selected-item">
            {{ device.name }} - {{ formatCurrency(device.selling_price) }}
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="selectedDevices.length === 0 || isLoading"
              (click)="addDevices()">
        Add {{ selectedDevices.length }} Device{{ selectedDevices.length === 1 ? '' : 's' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-content {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }

    .device-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .device-card {
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      border: 2px solid transparent;
    }

    .device-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .device-card.selected {
      border-color: #3498db;
      background-color: #f0f8ff;
    }

    .device-card h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .device-card p {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #666;
    }

    .price {
      font-weight: 600;
      color: #20bf6b !important;
    }

    .check-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #3498db;
    }

    .selected-summary {
      margin-top: 24px;
      padding: 16px;
      background: #f0f8ff;
      border-radius: 8px;
    }

    .selected-item {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .selected-item:last-child {
      border-bottom: none;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      gap: 12px;
    }
  `]
})
export class SimpleDeviceSelectorComponent implements OnInit {
  devices: any[] = [];
  selectedDevices: any[] = [];
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<SimpleDeviceSelectorComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  private loadDevices(): void {
    this.isLoading = true;
    console.log('Loading devices for project:', this.data.projectId);

    this.apiService.get<any>('/devices').subscribe({
      next: (response) => {
        console.log('Devices response:', response);
        // Handle both array response and object response
        if (Array.isArray(response)) {
          this.devices = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.devices = response.data;
        } else if (response && Array.isArray(response.devices)) {
          this.devices = response.devices;
        } else {
          console.warn('Unexpected response format:', response);
          this.devices = [];
        }
        console.log('Final devices array:', this.devices);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load devices:', error);
        this.snackBar.open('Failed to load devices: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
        this.devices = [];
        this.isLoading = false;
      }
    });
  }

  toggleDevice(device: any): void {
    const index = this.selectedDevices.findIndex(d => d.id === device.id);
    if (index >= 0) {
      this.selectedDevices.splice(index, 1);
    } else {
      this.selectedDevices.push(device);
    }
    console.log('Selected devices:', this.selectedDevices.length);
  }

  isSelected(device: any): boolean {
    return this.selectedDevices.some(d => d.id === device.id);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  addDevices(): void {
    if (this.selectedDevices.length === 0) {
      this.snackBar.open('No devices selected', 'Close', { duration: 3000 });
      return;
    }

    console.log('Adding devices to project:', this.data.projectId, this.selectedDevices);

    this.snackBar.open(`${this.selectedDevices.length} devices added successfully!`, 'Close', { duration: 3000 });
    this.dialogRef.close({ success: true, devices: this.selectedDevices });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}