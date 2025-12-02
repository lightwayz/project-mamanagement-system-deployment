import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CurrencyService } from '../../services/currency.service';
import { Project, ProjectLocation, ProjectDevice, UpdateProjectDeviceRequest, ProjectDeviceAssociationRequest } from '../../models/project.model';
import { ProjectDeviceSelectionDialogComponent } from '../project-device-selection-dialog/project-device-selection-dialog.component';
import { BuildSystem } from '../../models/build-system.model';

@Component({
  selector: 'app-project-device-manager',
  template: `
    <div class="device-manager-container">
      <div class="manager-header">
        <h3>Project Devices</h3>
        <button mat-raised-button color="primary" (click)="openDeviceSelector()">
          <mat-icon>add</mat-icon>
          Add Devices
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading project devices...</p>
      </div>

      <div *ngIf="!isLoading && projectData" class="locations-list">
        <mat-card *ngFor="let location of projectData.locations" class="location-card">
          <mat-card-header>
            <mat-card-title>{{location.name}}</mat-card-title>
            <mat-card-subtitle *ngIf="location.description">{{location.description}}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div *ngIf="location.devices.length === 0" class="no-devices">
              <mat-icon>devices_other</mat-icon>
              <p>No devices assigned to this location</p>
            </div>

            <div *ngIf="location.devices.length > 0" class="devices-table">
              <mat-table [dataSource]="location.devices" class="devices-table">
                
                <!-- Device Info Column -->
                <ng-container matColumnDef="device">
                  <mat-header-cell *matHeaderCellDef>Device</mat-header-cell>
                  <mat-cell *matCellDef="let projectDevice">
                    <div class="device-info">
                      <div class="device-name">{{projectDevice.device?.name}}</div>
                      <div class="device-details">
                        {{projectDevice.device?.brand}} {{projectDevice.device?.model}} | 
                        {{projectDevice.device?.category}}
                      </div>
                    </div>
                  </mat-cell>
                </ng-container>

                <!-- Quantity Column -->
                <ng-container matColumnDef="quantity">
                  <mat-header-cell *matHeaderCellDef>Quantity</mat-header-cell>
                  <mat-cell *matCellDef="let projectDevice">
                    <mat-form-field appearance="outline" class="quantity-field">
                      <input matInput 
                             type="number" 
                             min="1"
                             [value]="projectDevice.quantity"
                             (blur)="updateDeviceQuantity(projectDevice, $event)">
                    </mat-form-field>
                  </mat-cell>
                </ng-container>

                <!-- Unit Price Column -->
                <ng-container matColumnDef="unit_price">
                  <mat-header-cell *matHeaderCellDef>Unit Price</mat-header-cell>
                  <mat-cell *matCellDef="let projectDevice">
                    <mat-form-field appearance="outline" class="price-field">
                      <span matPrefix>{{ currentCurrencySymbol }}</span>
                      <input matInput 
                             type="number" 
                             min="0"
                             step="0.01"
                             [value]="projectDevice.unit_price"
                             (blur)="updateDevicePrice(projectDevice, $event)">
                    </mat-form-field>
                  </mat-cell>
                </ng-container>

                <!-- Total Price Column -->
                <ng-container matColumnDef="total_price">
                  <mat-header-cell *matHeaderCellDef>Total</mat-header-cell>
                  <mat-cell *matCellDef="let projectDevice">
                    <div class="total-price">
                      {{ projectDevice.total_price | appCurrency }}
                    </div>
                  </mat-cell>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
                  <mat-cell *matCellDef="let projectDevice">
                    <button mat-icon-button 
                            color="warn"
                            (click)="removeDevice(projectDevice)"
                            matTooltip="Remove device">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
              </mat-table>
            </div>

            <!-- Location Total -->
            <div *ngIf="location.devices.length > 0" class="location-total">
              <strong>Location Total: {{ getLocationTotal(location) | appCurrency }}</strong>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Project Total -->
      <mat-card *ngIf="!isLoading && projectData" class="total-card">
        <mat-card-content>
          <div class="project-total">
            <h4>Project Total: {{ getProjectTotal() | appCurrency }}</h4>
            <p>{{getTotalDeviceCount()}} devices across {{projectData.locations.length}} locations</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Empty State -->
      <div *ngIf="!isLoading && (!projectData || projectData.locations.length === 0)" class="empty-state">
        <mat-icon class="empty-icon">location_off</mat-icon>
        <h3>No locations found</h3>
        <p>This project doesn't have any locations with devices assigned.</p>
      </div>
    </div>
  `,
  styles: [`
    .device-manager-container {
      padding: 24px;
      min-height: 400px;
    }

    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .manager-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }

    .locations-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .location-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      background-color: var(--surface-color);
    }

    .location-card mat-card-header {
      background: var(--background-color);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .location-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .location-card mat-card-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .no-devices {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: var(--text-secondary);
      text-align: center;
    }

    .no-devices mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: var(--text-tertiary);
    }

    .devices-table {
      width: 100%;
      margin-top: 16px;
    }

    .device-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .device-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .device-details {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .quantity-field,
    .price-field {
      width: 100px;
    }

    .quantity-field .mat-mdc-form-field-infix,
    .price-field .mat-mdc-form-field-infix {
      min-height: 40px;
    }

    .total-price {
      font-weight: 600;
      color: #20bf6b;
      text-align: right;
    }

    .location-total {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      text-align: right;
      color: #20bf6b;
    }

    .total-card {
      background: var(--surface-color);
      border: 2px solid #20bf6b;
    }

    .project-total {
      text-align: center;
      padding: 16px;
    }

    .project-total h4 {
      margin: 0 0 8px 0;
      color: #20bf6b;
      font-size: 24px;
      font-weight: 700;
    }

    .project-total p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: var(--text-tertiary);
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
      max-width: 300px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .device-manager-container {
        padding: 16px;
      }

      .manager-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .manager-header button {
        width: 100%;
      }

      .devices-table {
        font-size: 14px;
      }

      .quantity-field,
      .price-field {
        width: 80px;
      }
    }
  `]
})
export class ProjectDeviceManagerComponent implements OnInit, OnDestroy {
  @Input() projectId!: number;
  
  displayedColumns = ['device', 'quantity', 'unit_price', 'total_price', 'actions'];
  projectData: any = null;
  isLoading = false;
  currentCurrencySymbol = '$';
  private currencySubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private currencyService: CurrencyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to currency changes
    this.currencySubscription = this.currencyService.getCurrentCurrency().subscribe(currency => {
      this.currentCurrencySymbol = currency.symbol;
    });

    if (this.projectId) {
      this.loadProjectDevices();
    }
  }

  ngOnDestroy(): void {
    if (this.currencySubscription) {
      this.currencySubscription.unsubscribe();
    }
  }

  private loadProjectDevices(): void {
    this.isLoading = true;
    this.apiService.get(`/projects/${this.projectId}/devices`).subscribe({
      next: (data) => {
        this.projectData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load project devices:', error);
        this.snackBar.open('Failed to load project devices', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  openDeviceSelector(): void {
    console.log('openDeviceSelector called with projectId:', this.projectId);

    try {
      // Validate that we have a projectId
      if (!this.projectId) {
        console.error('No projectId provided to ProjectDeviceManagerComponent');
        this.snackBar.open('Project ID is missing. Cannot open device selector.', 'Close', { duration: 5000 });
        return;
      }

      console.log('Opening ProjectDeviceSelectionDialogComponent...');
      const dialogRef = this.dialog.open(ProjectDeviceSelectionDialogComponent, {
        width: '95%',
        maxWidth: '1400px',
        height: '90vh',
        disableClose: false,
        data: {
          projectId: this.projectId
        }
      });

      console.log('Dialog opened successfully, subscribing to afterClosed...');

      dialogRef.afterClosed().subscribe({
        next: (result) => {
          console.log('Dialog closed with result:', result);
          if (result && result.success) {
            // Successfully added devices, refresh the project data
            this.loadProjectDevices();
            this.snackBar.open('Devices added successfully', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error in dialog afterClosed subscription:', error);
          this.snackBar.open('Error processing dialog result: ' + error.message, 'Close', { duration: 5000 });
        }
      });

    } catch (error: any) {
      console.error('Error opening device selector dialog:', error);
      this.snackBar.open('Failed to open device selector: ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
    }
  }

  addDevicesToProject(selectedDevices: any[], targetLocations: any[]): void {
    if (!selectedDevices || selectedDevices.length === 0) {
      this.snackBar.open('No devices selected', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Prepare the devices data for API call
    const devicesData = selectedDevices.map(device => ({
      device_id: device.device_id || device.id,
      location_id: device.location_id || 'default',
      quantity: device.quantity || 1,
      unit_price: device.unit_price || device.selling_price || 0
    }));

    const locationsData = targetLocations || [];

    const requestData = {
      devices: devicesData,
      locations: locationsData
    };

    this.apiService.post(`/projects/${this.projectId}/add-devices`, requestData).subscribe({
      next: (response) => {
        this.snackBar.open(`Successfully added ${selectedDevices.length} devices to project`, 'Close', { duration: 3000 });
        this.loadProjectDevices(); // Reload the project devices
      },
      error: (error) => {
        console.error('Failed to add devices to project:', error);
        this.snackBar.open('Failed to add devices to project', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  updateDeviceQuantity(projectDevice: any, event: any): void {
    const newQuantity = parseInt(event.target.value) || 1;
    if (newQuantity !== projectDevice.quantity) {
      this.updateDevice(projectDevice, { quantity: newQuantity, unit_price: projectDevice.unit_price });
    }
  }

  updateDevicePrice(projectDevice: any, event: any): void {
    const newPrice = parseFloat(event.target.value) || 0;
    if (newPrice !== projectDevice.unit_price) {
      this.updateDevice(projectDevice, { quantity: projectDevice.quantity, unit_price: newPrice });
    }
  }

  private updateDevice(projectDevice: any, updateData: UpdateProjectDeviceRequest): void {
    this.apiService.put(`/projects/${this.projectId}/devices/${projectDevice.device_id}`, updateData).subscribe({
      next: (response) => {
        // Update local data
        projectDevice.quantity = updateData.quantity;
        projectDevice.unit_price = updateData.unit_price;
        projectDevice.total_price = updateData.quantity * updateData.unit_price;
        
        this.snackBar.open('Device updated successfully', 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Failed to update device:', error);
        this.snackBar.open('Failed to update device', 'Close', { duration: 3000 });
        // Reload data to reset UI
        this.loadProjectDevices();
      }
    });
  }

  removeDevice(projectDevice: any): void {
    if (confirm(`Remove ${projectDevice.device?.name} from this project?`)) {
      this.apiService.delete(`/projects/${this.projectId}/devices/${projectDevice.device_id}`).subscribe({
        next: () => {
          this.snackBar.open('Device removed successfully', 'Close', { duration: 2000 });
          this.loadProjectDevices(); // Reload to update UI
        },
        error: (error) => {
          console.error('Failed to remove device:', error);
          this.snackBar.open('Failed to remove device', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getLocationTotal(location: any): number {
    if (!location || !location.devices || !Array.isArray(location.devices)) {
      return 0;
    }
    return location.devices.reduce((total: number, device: any) => {
      // Explicitly convert to number to handle string values from API
      const deviceTotal = parseFloat(device.total_price) || 0;
      return total + deviceTotal;
    }, 0);
  }

  getProjectTotal(): number {
    if (!this.projectData || !this.projectData.locations || !Array.isArray(this.projectData.locations)) {
      return 0;
    }
    return this.projectData.locations.reduce((total: number, location: any) => {
      const locationTotal = this.getLocationTotal(location);
      return total + locationTotal;
    }, 0);
  }

  getTotalDeviceCount(): number {
    if (!this.projectData) return 0;
    return this.projectData.locations.reduce((total: number, location: any) => {
      return total + location.devices.reduce((locationTotal: number, device: any) => locationTotal + device.quantity, 0);
    }, 0);
  }

  importBuildSystemToProject(buildSystem: BuildSystem): void {
    if (!buildSystem) {
      this.snackBar.open('No build system selected', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    this.apiService.post(`/projects/${this.projectId}/import-build-system`, {
      build_system_id: buildSystem.id
    }).subscribe({
      next: (response) => {
        this.snackBar.open(`Successfully imported build system: ${buildSystem.name}`, 'Close', { duration: 3000 });
        this.loadProjectDevices(); // Reload the project devices
      },
      error: (error) => {
        console.error('Failed to import build system:', error);
        this.snackBar.open('Failed to import build system', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}