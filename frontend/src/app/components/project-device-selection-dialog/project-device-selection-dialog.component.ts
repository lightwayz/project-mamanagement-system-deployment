import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Device } from '../../models/device.model';
import { BuildSystem } from '../../models/build-system.model';
import { DeviceSelectionItem, CreateProjectLocationRequest, CreateProjectDeviceRequest } from '../../models/project.model';

interface LocationStep {
  name: string;
  description: string;
  id?: string;
  level?: number;
  parent_location_id?: string;
  subLocations?: LocationStep[];
  isExpanded?: boolean;
  devices: DeviceSelectionItem[];
}

@Component({
  selector: 'app-project-device-selection-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>add_circle</mat-icon>
        </div>
        <div class="header-text">
          <h2>Add Devices to Project</h2>
          <p>Select devices and assign them to locations</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button">
        <span class="close-x">×</span>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Custom Step Navigation -->
      <div class="step-navigation">
        <div class="step-nav-item"
             [class.active]="currentStep === 1"
             [class.completed]="currentStep > 1"
             (click)="goToStep(1)">
          <div class="step-number">1</div>
          <span>Import System</span>
        </div>
        <div class="step-nav-item"
             [class.active]="currentStep === 2"
             [class.completed]="currentStep > 2"
             (click)="goToStep(2)">
          <div class="step-number">2</div>
          <span>Setup Locations</span>
        </div>
        <div class="step-nav-item"
             [class.active]="currentStep === 3"
             [class.completed]="currentStep > 3"
             (click)="goToStep(3)">
          <div class="step-number">3</div>
          <span>Select Devices</span>
        </div>
        <div class="step-nav-item"
             [class.active]="currentStep === 4"
             [class.completed]="currentStep > 4"
             (click)="goToStep(4)">
          <div class="step-number">4</div>
          <span>Assign Devices</span>
        </div>
      </div>

      <!-- Step Content Container -->
      <div class="step-content-container">

        <!-- Step 1: Build System Import -->
        <div *ngIf="currentStep === 1" class="step-content">
          <div class="step-header">
            <mat-icon class="step-icon">account_tree</mat-icon>
            <div class="step-title">
              <h3>Import Build System (Optional)</h3>
              <p>Import devices and locations from an existing build system template</p>
            </div>
          </div>

          <div class="import-section">
            <mat-form-field appearance="outline" class="build-system-select">
              <mat-label>Select Build System</mat-label>
              <mat-select [(value)]="selectedBuildSystemId" (selectionChange)="onBuildSystemSelected($event.value)">
                <mat-option value="">No build system (manual setup)</mat-option>
                <mat-option *ngFor="let system of buildSystems" [value]="system.id">
                  {{ system.name }} - {{ formatCurrency(system.total_cost) }}
                  ({{ system.locations_count }} locations)
                </mat-option>
              </mat-select>
            </mat-form-field>

            <div *ngIf="selectedBuildSystem" class="build-system-preview">
              <mat-card class="preview-card">
                <mat-card-header>
                  <div class="preview-header">
                    <div class="preview-title">
                      <mat-card-title>{{ selectedBuildSystem.name }}</mat-card-title>
                      <mat-card-subtitle>{{ selectedBuildSystem.description }}</mat-card-subtitle>
                    </div>
                    <div class="preview-status">
                      <mat-chip-set>
                        <mat-chip class="status-chip">Ready to Import</mat-chip>
                      </mat-chip-set>
                    </div>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="preview-stats">
                    <div class="stat-item">
                      <div class="stat-icon">
                        <mat-icon>location_on</mat-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-value">{{ selectedBuildSystem.locations_count || 0 }}</span>
                        <span class="stat-label">Locations</span>
                      </div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-icon">
                        <mat-icon>attach_money</mat-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-value">{{ formatCurrency(selectedBuildSystem.total_cost || 0) }}</span>
                        <span class="stat-label">Total Cost</span>
                      </div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-icon">
                        <mat-icon>person</mat-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-value">{{ selectedBuildSystem.creator?.name || 'Unknown' }}</span>
                        <span class="stat-label">Created By</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions class="preview-actions">
                  <button mat-raised-button color="primary" (click)="importBuildSystem()" [disabled]="isImporting" class="import-btn">
                    <mat-icon *ngIf="isImporting" class="loading-icon">refresh</mat-icon>
                    <mat-icon *ngIf="!isImporting">download</mat-icon>
                    {{ isImporting ? 'Importing...' : 'Import Build System' }}
                  </button>
                  <button mat-stroked-button (click)="clearBuildSystemSelection()" class="clear-btn">
                    <mat-icon>clear</mat-icon>
                    Clear Selection
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>

          <div class="step-actions">
            <div class="spacer"></div>
            <button mat-raised-button color="primary" (click)="nextStep()" class="next-button">
              <mat-icon>arrow_forward</mat-icon>
              Next
            </button>
          </div>
        </div>

        <!-- Step 2: Location Setup -->
        <div *ngIf="currentStep === 2" class="step-content">
          <div class="step-header">
            <mat-icon class="step-icon">location_on</mat-icon>
            <div class="step-title">
              <h3>Location Setup</h3>
              <p>Define locations and sub-locations for your project</p>
            </div>
          </div>

          <div class="location-setup">
            <div class="location-header">
              <h4 class="subsection-title">Project Locations</h4>
              <button type="button" mat-raised-button color="accent" (click)="addLocation()" class="add-location-btn">
                <mat-icon>add</mat-icon>
                Add Location
              </button>
            </div>

            <div *ngIf="locations.length === 0" class="no-locations">
              <mat-icon>location_off</mat-icon>
              <p>No locations defined yet. Add a location to get started.</p>
            </div>

            <div *ngFor="let location of locations; let i = index" class="location-item">
              <mat-card class="location-card">
                <mat-card-header>
                  <div class="location-header-content">
                    <div class="location-inputs">
                      <mat-form-field appearance="outline" class="location-name-field">
                        <mat-label>Location Name</mat-label>
                        <input matInput [(ngModel)]="location.name" placeholder="e.g., Living Room">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="location-desc-field">
                        <mat-label>Description</mat-label>
                        <input matInput [(ngModel)]="location.description" placeholder="Location description">
                      </mat-form-field>
                    </div>
                    <div class="location-actions">
                      <button mat-icon-button (click)="toggleLocationExpansion(i)" [matTooltip]="location.isExpanded ? 'Collapse' : 'Expand'">
                        <mat-icon>{{ location.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="removeLocation(i)" matTooltip="Remove Location">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </mat-card-header>

                <mat-card-content *ngIf="location.isExpanded">
                  <!-- Sub-locations -->
                  <div class="sub-locations-section">
                    <div class="sub-locations-header">
                      <h5>Sub-Locations</h5>
                      <button mat-button color="primary" (click)="addSubLocation(i)">
                        <mat-icon>add</mat-icon>
                        Add Sub-Location
                      </button>
                    </div>

                    <div *ngIf="location.subLocations && location.subLocations.length > 0" class="sub-locations-list">
                      <div *ngFor="let subLocation of location.subLocations; let j = index" class="sub-location-item">
                        <mat-form-field appearance="outline" class="sub-location-name">
                          <mat-label>Sub-Location Name</mat-label>
                          <input matInput [(ngModel)]="subLocation.name" placeholder="e.g., TV Area">
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="sub-location-desc">
                          <mat-label>Description</mat-label>
                          <input matInput [(ngModel)]="subLocation.description" placeholder="Sub-location description">
                        </mat-form-field>
                        <button mat-icon-button color="warn" (click)="removeSubLocation(i, j)" matTooltip="Remove Sub-Location">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <div class="step-actions">
            <button mat-button (click)="previousStep()" [disabled]="currentStep <= 1">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <div class="spacer"></div>
            <button mat-raised-button color="primary" (click)="nextStep()" [disabled]="locations.length === 0" class="next-button">
              <mat-icon>arrow_forward</mat-icon>
              Next
            </button>
          </div>
        </div>

        <!-- Step 3: Device Selection -->
        <div *ngIf="currentStep === 3" class="step-content">
          <div class="step-header">
            <mat-icon class="step-icon">devices</mat-icon>
            <div class="step-title">
              <h3>Device Selection</h3>
              <p>Choose devices from inventory and assign them to locations</p>
            </div>
          </div>

          <!-- Device Search and Filters -->
          <div class="device-filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search devices</mat-label>
              <input matInput [formControl]="searchControl" placeholder="Search by name, brand, or model">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="categoryFilter">
                <mat-option value="">All Categories</mat-option>
                <mat-option *ngFor="let category of categories" [value]="category">
                  {{ category }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Device Grid -->
          <div class="device-grid" *ngIf="filteredDevices.length > 0">
            <div *ngFor="let device of filteredDevices" class="device-card"
                 [class.selected]="isDeviceSelected(device)"
                 (click)="toggleDeviceSelection(device)">
              <div class="device-image">
                <img *ngIf="device.image_url" [src]="device.image_url" [alt]="device.name">
                <mat-icon *ngIf="!device.image_url" class="default-icon">devices</mat-icon>
              </div>
              <div class="device-info">
                <h4 class="device-name">{{ device.name }}</h4>
                <p class="device-details">{{ device.brand }} {{ device.model }}</p>
                <p class="device-price">{{ formatCurrency(device.selling_price) }}</p>
              </div>
              <div class="selection-indicator" *ngIf="isDeviceSelected(device)">
                <mat-icon>check_circle</mat-icon>
              </div>
            </div>
          </div>

          <div *ngIf="filteredDevices.length === 0" class="no-devices">
            <mat-icon>devices_off</mat-icon>
            <p>No devices found matching your criteria.</p>
          </div>

          <!-- Selection Summary -->
          <div *ngIf="selectedDevices.length === 0" class="selection-help" style="margin-top: 16px; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
            <mat-icon style="vertical-align: middle; margin-right: 8px; color: #856404;">info</mat-icon>
            <strong>Select devices:</strong> Click on device cards above to select them for your project. You need to select at least one device to continue.
          </div>

          <div *ngIf="selectedDevices.length > 0" class="selection-summary" style="margin-top: 16px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
            <mat-icon style="vertical-align: middle; margin-right: 8px; color: #155724;">check_circle</mat-icon>
            <strong>{{ selectedDevices.length }} device{{ selectedDevices.length === 1 ? '' : 's' }} selected:</strong>
            {{ getSelectedDeviceNames() }}
          </div>

          <div class="step-actions">
            <button mat-button (click)="previousStep()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <div class="spacer"></div>
            <button mat-raised-button color="primary" (click)="nextStep()" [disabled]="selectedDevices.length === 0" class="next-button">
              <mat-icon *ngIf="selectedDevices.length > 0">arrow_forward</mat-icon>
              <mat-icon *ngIf="selectedDevices.length === 0">block</mat-icon>
              Next
              <span *ngIf="selectedDevices.length > 0">({{ selectedDevices.length }} selected)</span>
            </button>
          </div>

        </div>

        <!-- Step 4: Device Assignment -->
        <div *ngIf="currentStep === 4" class="step-content">
          <div class="step-header">
            <mat-icon class="step-icon">assignment</mat-icon>
            <div class="step-title">
              <h3>Device Assignment</h3>
              <p>Assign selected devices to locations and set quantities</p>
            </div>
          </div>

          <div class="assignment-section" *ngIf="selectedDevices.length > 0">
            <div *ngFor="let device of selectedDevices" class="device-assignment">
              <mat-card class="assignment-card">
                <mat-card-header>
                  <div class="device-header">
                    <div class="device-summary">
                      <h4>{{ device.name }}</h4>
                      <p>{{ device.brand }} {{ device.model }} - {{ formatCurrency(device.selling_price) }}</p>
                    </div>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="assignment-controls">
                    <mat-form-field appearance="outline" class="location-select">
                      <mat-label>Assign to Location</mat-label>
                      <mat-select [(value)]="device.assignedLocation" (selectionChange)="onDeviceAssignmentChange()">
                        <mat-option *ngFor="let location of locationOptions" [value]="location.id">
                          {{ location.name }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="quantity-field">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" [(ngModel)]="device.selectedQuantity" min="1" max="99" (ngModelChange)="onQuantityChange()">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="price-field">
                      <mat-label>Unit Price</mat-label>
                      <input matInput type="number" [(ngModel)]="device.selectedPrice" min="0" step="0.01" (ngModelChange)="onPriceChange()">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <div class="cost-summary" *ngIf="selectedDevices.length > 0">
            <mat-card class="summary-card">
              <mat-card-header>
                <mat-card-title>Cost Summary</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="total-cost">
                  <span class="total-label">Total Selected Devices Cost:</span>
                  <span class="total-amount">{{ formatCurrency(totalCost) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="step-actions">
            <button mat-button (click)="previousStep()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <div class="spacer"></div>
            <button mat-raised-button color="primary" (click)="addDevicesToProject()"
                    [disabled]="!canAddDevices || isLoading">
              <mat-icon *ngIf="isLoading" class="loading-icon">refresh</mat-icon>
              <mat-icon *ngIf="!isLoading">check</mat-icon>
              {{ isLoading ? 'Adding...' : 'Add Devices' }}
            </button>
          </div>
        </div>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="onCancel()" class="cancel-btn">
        Cancel
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 32px 16px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
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
      border-radius: 50%;
    }

    .close-x {
      font-size: 24px;
      font-weight: 300;
      line-height: 1;
    }

    .dialog-content {
      padding: 0 !important;
      max-height: 80vh;
      overflow: visible;
    }

    /* Custom Step Navigation */
    .step-navigation {
      display: flex;
      justify-content: space-between;
      padding: 24px 32px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .step-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 12px 16px;
      border-radius: 8px;
      transition: all 0.2s ease;
      flex: 1;
      text-align: center;
    }

    .step-nav-item:hover {
      background: rgba(52, 152, 219, 0.1);
    }

    .step-nav-item.active {
      background: #3498db;
      color: white;
    }

    .step-nav-item.completed {
      background: #27ae60;
      color: white;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      font-weight: 600;
      font-size: 14px;
    }

    .step-nav-item.active .step-number {
      background: rgba(255, 255, 255, 0.3);
    }

    .step-nav-item.completed .step-number {
      background: rgba(255, 255, 255, 0.3);
    }

    .step-content-container {
      min-height: 500px;
    }

    .step-content {
      padding: 32px;
      min-height: 500px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .step-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3498db;
    }

    .step-title h3 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2d3436;
    }

    .step-title p {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .step-actions button {
      min-width: 100px;
      height: 40px;
    }

    .step-actions button[disabled] {
      opacity: 0.6;
      pointer-events: none;
    }

    .next-button {
      background: #3498db !important;
      color: white !important;
      border: none !important;
      min-width: 120px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .next-button[disabled] {
      background: #95a5a6 !important;
      opacity: 0.7 !important;
    }

    .spacer {
      flex: 1;
    }

    .import-section {
      margin-bottom: 24px;
    }

    .build-system-select {
      width: 100%;
      max-width: 500px;
    }

    .build-system-preview {
      margin-top: 24px;
    }

    .preview-card {
      border: 2px solid #e3f2fd;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(52, 152, 219, 0.1);
      background: linear-gradient(135deg, #ffffff 0%, #f8fafe 100%);
      overflow: hidden;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
      gap: 16px;
    }

    .preview-title {
      flex: 1;
    }

    .preview-status {
      flex-shrink: 0;
    }

    .status-chip {
      background: #e8f5e8 !important;
      color: #2e7d32 !important;
      font-weight: 500;
      font-size: 12px;
    }

    .preview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 24px;
      margin-top: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
    }

    .stat-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-color: #3498db;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      border-radius: 50%;
      color: white;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #2d3436;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: #636e72;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preview-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding: 24px 32px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      margin: 0 -24px -24px;
    }

    .import-btn {
      min-width: 180px;
      height: 48px;
      border-radius: 24px;
      font-weight: 600;
      text-transform: none;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    }

    .import-btn:hover:not([disabled]) {
      box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
      transform: translateY(-2px);
    }

    .import-btn mat-icon {
      margin-right: 8px;
    }

    .clear-btn {
      min-width: 140px;
      height: 48px;
      border-radius: 24px;
      font-weight: 500;
      text-transform: none;
      border: 2px solid #e0e0e0;
      color: #666;
    }

    .clear-btn:hover {
      border-color: #3498db;
      color: #3498db;
      background: #f8fafe;
    }

    .clear-btn mat-icon {
      margin-right: 8px;
    }

    .location-setup {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      margin-bottom: 24px;
    }

    .location-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .location-item {
      margin-bottom: 16px;
    }

    .location-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
    }

    .location-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .location-inputs {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .location-name-field, .location-desc-field {
      flex: 1;
    }

    .location-actions {
      display: flex;
      gap: 8px;
    }

    .sub-locations-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .sub-locations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .sub-location-item {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .sub-location-name, .sub-location-desc {
      flex: 1;
    }

    .device-filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
    }

    .search-field {
      flex: 2;
    }

    .filter-field {
      flex: 1;
    }

    .device-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .device-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      background: white;
    }

    .device-card:hover {
      border-color: #3498db;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
    }

    .device-card.selected {
      border-color: #3498db;
      background: #f8fafe;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
    }

    .device-image {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      margin-bottom: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .device-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .device-image .default-icon {
      font-size: 40px;
      color: #6c757d;
    }

    .device-info {
      text-align: center;
    }

    .device-name {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2d3436;
    }

    .device-details {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #6c757d;
    }

    .device-price {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #20bf6b;
    }

    .selection-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #3498db;
    }

    .assignment-section {
      margin-bottom: 24px;
    }

    .device-assignment {
      margin-bottom: 16px;
    }

    .assignment-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
    }

    .device-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .device-summary h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .device-summary p {
      margin: 0;
      font-size: 14px;
      color: #6c757d;
    }

    .assignment-controls {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .location-select {
      flex: 2;
    }

    .quantity-field {
      flex: 0.6;
    }

    .price-field {
      flex: 1.4;
    }

    .cost-summary {
      margin-top: 24px;
    }

    .summary-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .total-cost {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }

    .total-label {
      color: #2d3436;
    }

    .total-amount {
      color: #20bf6b;
      font-size: 20px;
    }

    .no-locations, .no-devices {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #6c757d;
    }

    .no-locations mat-icon, .no-devices mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
      padding: 20px 32px 24px;
      margin: 0 -24px -24px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
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
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .step-content {
        padding: 20px 16px;
      }

      .device-grid {
        grid-template-columns: 1fr;
      }

      .location-inputs {
        flex-direction: column;
        gap: 12px;
      }

      .assignment-controls {
        flex-direction: column;
        gap: 12px;
      }

      .device-filters {
        flex-direction: column;
        gap: 12px;
      }

      .step-navigation {
        flex-wrap: wrap;
        gap: 8px;
      }

      .step-nav-item {
        flex: 1 1 auto;
        min-width: 120px;
      }
    }

    /* Dark Theme Support */
    :host-context(.dark-theme) {
      .step-navigation {
        background: var(--surface-color) !important;
        border-bottom-color: var(--border-color) !important;
      }

      .step-title h3 {
        color: var(--text-primary) !important;
      }

      .step-title p {
        color: var(--text-secondary) !important;
      }

      .step-header {
        border-bottom-color: var(--border-color) !important;
      }

      .step-actions {
        border-top-color: var(--border-color) !important;
      }

      .preview-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
      }

      .preview-stats {
        background: var(--header-bg) !important;
        border-color: var(--border-color) !important;
      }

      .stat-item {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
      }

      /* Location Setup Section */
      .location-setup {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
      }

      .location-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;

        ::ng-deep {
          .mat-mdc-card,
          .mat-card {
            background: var(--surface-color) !important;
          }
        }
      }

      .sub-locations-section {
        border-top-color: var(--border-color) !important;
      }

      .sub-location-item {
        background: var(--header-bg) !important;
        border-color: var(--border-color) !important;
      }

      .device-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
      }

      .device-card.selected {
        background: rgba(52, 152, 219, 0.1) !important;
      }

      .device-image {
        background: var(--header-bg) !important;
      }

      .device-name {
        color: var(--text-primary) !important;
      }

      .device-details {
        color: var(--text-secondary) !important;
      }

      .subsection-title {
        color: var(--text-primary) !important;
      }

      .no-locations {
        color: var(--text-secondary) !important;
      }

      /* Device Selection Tab */
      .selection-help {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-primary) !important;

        mat-icon {
          color: var(--text-primary) !important;
        }
      }

      .selection-summary {
        background: rgba(76, 175, 80, 0.1) !important;
        border-color: var(--border-color) !important;
        color: var(--text-primary) !important;

        mat-icon {
          color: #4caf50 !important;
        }
      }

      .selection-indicator {
        color: #3498db !important;

        mat-icon {
          background: var(--surface-color);
          border-radius: 50%;
        }
      }

      .no-devices {
        color: var(--text-secondary) !important;
      }

      /* Device Assignment Tab */
      .assignment-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;

        ::ng-deep {
          .mat-mdc-card,
          .mat-card {
            background: var(--surface-color) !important;
          }
        }
      }

      .device-summary h4 {
        color: var(--text-primary) !important;
      }

      .device-summary p {
        color: var(--text-secondary) !important;
      }

      .summary-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;

        ::ng-deep {
          .mat-mdc-card,
          .mat-card {
            background: var(--surface-color) !important;
          }
        }
      }

      .total-label {
        color: var(--text-primary) !important;
      }

      .dialog-actions {
        background: var(--header-bg) !important;
        border-top-color: var(--border-color) !important;
      }

      .cancel-btn {
        background: var(--surface-color) !important;
        color: var(--text-primary) !important;
        border-color: var(--border-color) !important;
      }
    }
  `]
})
export class ProjectDeviceSelectionDialogComponent implements OnInit {
  // Current step tracking
  currentStep = 1;

  // Search and filters
  searchControl = new FormControl('');
  categoryFilter = new FormControl('');

  // Data
  buildSystems: BuildSystem[] = [];
  selectedBuildSystem: BuildSystem | null = null;
  selectedBuildSystemId: string = '';
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  selectedDevices: DeviceSelectionItem[] = [];
  categories: string[] = [];
  locations: LocationStep[] = [];

  // Cached values for performance
  private _locationOptions: {id: string, name: string}[] = [];
  private _totalCost: number = 0;
  private _canAddDevices: boolean = false;

  // State
  isLoading = false;
  isImporting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjectDeviceSelectionDialogComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
  ) {
  }

  ngOnInit(): void {
    this.loadBuildSystems();
    this.loadDevices();
    this.setupFilters();

    // Add default location if none exist
    if (this.locations.length === 0) {
      this.addLocation();
    }

    // Initialize cached values
    this.refreshCachedValues();
  }

  // Step Navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= 4) {
      this.currentStep = step;
      // Refresh cached values when navigating to step 4 (assignment)
      if (step === 4) {
        this.refreshCachedValues();
      }
    }
  }

  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
      // Refresh cached values when moving to step 4 (assignment)
      if (this.currentStep === 4) {
        this.refreshCachedValues();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private loadBuildSystems(): void {
    this.apiService.get<{data: BuildSystem[]}>('/build-systems').subscribe({
      next: (response) => {
        this.buildSystems = response.data || [];
      },
      error: (error) => {
        console.error('Failed to load build systems:', error);
        this.snackBar.open('Failed to load build systems', 'Close', { duration: 3000 });
      }
    });
  }

  private loadDevices(): void {
    console.log('Loading devices from API...');
    this.apiService.get<any>('/devices').subscribe({
      next: (response) => {
        console.log('Devices API response:', response);

        // Handle different response formats
        let devices: Device[] = [];
        if (Array.isArray(response)) {
          devices = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          devices = response.data;
        } else if (response && Array.isArray(response.devices)) {
          devices = response.devices;
        } else {
          console.warn('Unexpected response format:', response);
          devices = [];
        }

        this.devices = devices;
        this.filteredDevices = devices;
        this.extractCategories();
        console.log('Final devices array:', this.devices.length, 'devices loaded');
      },
      error: (error) => {
        console.error('Failed to load devices:', error);
        this.snackBar.open('Failed to load devices - ' + (error.message || 'Unknown error'), 'Close', { duration: 5000 });
        // Set empty arrays as fallback
        this.devices = [];
        this.filteredDevices = [];
        this.categories = [];
      }
    });
  }

  private extractCategories(): void {
    const categorySet = new Set<string>();
    this.devices.forEach(device => {
      if (device.category) {
        categorySet.add(device.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  private setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    // Category filter
    this.categoryFilter.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private applyFilters(): void {
    let filtered = this.devices;

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchTerm) ||
        device.brand.toLowerCase().includes(searchTerm) ||
        device.model.toLowerCase().includes(searchTerm) ||
        (device.description && device.description.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    const selectedCategory = this.categoryFilter.value;
    if (selectedCategory) {
      filtered = filtered.filter(device => device.category === selectedCategory);
    }

    this.filteredDevices = filtered;
  }

  onBuildSystemSelected(buildSystemId: string): void {
    this.selectedBuildSystemId = buildSystemId;
    if (buildSystemId) {
      this.selectedBuildSystem = this.buildSystems.find(bs => bs.id === parseInt(buildSystemId)) || null;
    } else {
      this.selectedBuildSystem = null;
    }
  }

  clearBuildSystemSelection(): void {
    this.selectedBuildSystem = null;
    this.selectedBuildSystemId = '';
  }

  importBuildSystem(): void {
    if (!this.selectedBuildSystem) return;

    this.isImporting = true;
    this.apiService.post<any>(`/build-systems/${this.selectedBuildSystem.id}/import-to-project`, {}).subscribe({
      next: (response) => {
        console.log('Import response:', response);

        // Clear existing data
        this.locations = [];
        this.selectedDevices = [];

        // Import locations from build system
        if (response.locations && response.locations.length > 0) {
          this.locations = response.locations.map((location: any) => ({
            name: location.name,
            description: location.description || '',
            id: this.generateLocationId(),
            level: location.level || 0,
            parent_location_id: location.parent_location_id || undefined,
            devices: [],
            subLocations: location.subLocations ? location.subLocations.map((subLoc: any) => ({
              name: subLoc.name,
              description: subLoc.description || '',
              id: this.generateLocationId(),
              level: 1,
              parent_location_id: location.id,
              devices: [],
              subLocations: [],
              isExpanded: true
            })) : [],
            isExpanded: true
          }));
        }

        // Import devices from build system
        if (response.devices && response.devices.length > 0) {
          this.selectedDevices = response.devices.map((device: any) => {
            // Find the location for this device
            let assignedLocationId = '';
            const locationName = device.location_name || device.assigned_location;

            if (locationName) {
              // Find matching location by name
              const matchingLocation = this.locations.find(loc => loc.name === locationName);
              if (matchingLocation) {
                assignedLocationId = matchingLocation.id || '';
              } else {
                // Check sub-locations
                for (const loc of this.locations) {
                  const matchingSubLoc = loc.subLocations?.find(subLoc => subLoc.name === locationName);
                  if (matchingSubLoc) {
                    assignedLocationId = matchingSubLoc.id || '';
                    break;
                  }
                }
              }
            }

            return {
              id: device.id || device.device_id,
              name: device.name,
              category: device.category,
              brand: device.brand,
              model: device.model,
              description: device.description || '',
              cost_price: device.cost_price || 0,
              selling_price: device.selling_price || device.unit_price,
              image_url: device.image_url,
              is_active: true,
              selectedQuantity: device.quantity || 1,
              selectedPrice: device.unit_price || device.selling_price,
              assignedLocation: assignedLocationId
            };
          });
        }

        this.isImporting = false;
        this.refreshCachedValues();
        this.snackBar.open(
          `Build system imported: ${this.locations.length} locations, ${this.selectedDevices.length} devices`,
          'Close',
          { duration: 4000 }
        );

        console.log('Imported locations:', this.locations);
        console.log('Imported devices:', this.selectedDevices);
      },
      error: (error) => {
        console.error('Failed to import build system:', error);
        this.snackBar.open('Failed to import build system', 'Close', { duration: 3000 });
        this.isImporting = false;
      }
    });
  }

  addLocation(): void {
    const locationNames = ['Living Room', 'Kitchen', 'Bedroom', 'Office', 'Dining Room', 'Bathroom', 'Garage'];
    const defaultName = this.locations.length < locationNames.length
      ? locationNames[this.locations.length]
      : `Location ${this.locations.length + 1}`;

    const newLocation: LocationStep = {
      name: defaultName,
      description: '',
      id: this.generateLocationId(),
      level: 0,
      devices: [],
      subLocations: [],
      isExpanded: true
    };
    this.locations.push(newLocation);
    this.refreshCachedValues();
  }

  removeLocation(index: number): void {
    this.locations.splice(index, 1);
    this.refreshCachedValues();
  }

  addSubLocation(parentIndex: number, name: string = '', description: string = ''): void {
    const parentLocation = this.locations[parentIndex];
    if (!parentLocation.subLocations) {
      parentLocation.subLocations = [];
    }

    const subLocationName = name || `${parentLocation.name} - Sub Area ${parentLocation.subLocations.length + 1}`;

    const newSubLocation: LocationStep = {
      name: subLocationName,
      description: description,
      id: this.generateLocationId(),
      level: 1,
      parent_location_id: parentLocation.id,
      devices: [],
      subLocations: [],
      isExpanded: true
    };

    parentLocation.subLocations.push(newSubLocation);
    parentLocation.isExpanded = true;
    this.refreshCachedValues();
  }

  removeSubLocation(parentIndex: number, subIndex: number): void {
    const parentLocation = this.locations[parentIndex];
    if (parentLocation.subLocations) {
      parentLocation.subLocations.splice(subIndex, 1);
    }
    this.refreshCachedValues();
  }

  toggleLocationExpansion(index: number): void {
    this.locations[index].isExpanded = !this.locations[index].isExpanded;
  }

  private generateLocationId(): string {
    return 'loc_' + Math.random().toString(36).substr(2, 9);
  }

  toggleDeviceSelection(device: Device): void {
    console.log('Toggle device selection called for device:', device);
    const existingIndex = this.selectedDevices.findIndex(d => d.id === device.id);
    console.log('Existing index:', existingIndex);

    if (existingIndex >= 0) {
      console.log('Removing device from selection');
      this.selectedDevices.splice(existingIndex, 1);
    } else {
      console.log('Adding device to selection');
      const deviceSelection: DeviceSelectionItem = {
        ...device,
        selectedQuantity: 1,
        selectedPrice: device.selling_price,
        assignedLocation: ''
      };
      this.selectedDevices.push(deviceSelection);
    }
    console.log('Current selected devices count:', this.selectedDevices.length);
    console.log('Selected devices:', this.selectedDevices);
    this.refreshCachedValues();
  }

  isDeviceSelected(device: Device): boolean {
    return this.selectedDevices.some(d => d.id === device.id);
  }

  // Getter methods for cached values (used in template)
  get locationOptions(): {id: string, name: string}[] {
    return this._locationOptions;
  }

  get totalCost(): number {
    return this._totalCost;
  }

  get canAddDevices(): boolean {
    return this._canAddDevices;
  }

  // Private method to calculate location options
  private updateLocationOptions(): void {
    const options: {id: string, name: string}[] = [];

    this.locations.forEach(location => {
      if (location.id) {
        options.push({ id: location.id, name: location.name });
      }

      if (location.subLocations) {
        location.subLocations.forEach(subLocation => {
          if (subLocation.id) {
            options.push({ id: subLocation.id, name: `${location.name} → ${subLocation.name}` });
          }
        });
      }
    });

    this._locationOptions = options;
  }

  // Private method to calculate total cost
  private updateTotalCost(): void {
    this._totalCost = this.selectedDevices.reduce((total, device) => {
      return total + ((device.selectedQuantity || 0) * (device.selectedPrice || 0));
    }, 0);
  }

  // Private method to update can add devices status
  private updateCanAddDevices(): void {
    this._canAddDevices = this.selectedDevices.length > 0 &&
           this.selectedDevices.every(device =>
             device.assignedLocation &&
             device.selectedQuantity &&
             device.selectedQuantity > 0 &&
             device.selectedPrice !== undefined &&
             device.selectedPrice >= 0
           );
  }

  // Method to refresh all cached values
  private refreshCachedValues(): void {
    this.updateLocationOptions();
    this.updateTotalCost();
    this.updateCanAddDevices();
  }

  addDevicesToProject(): void {
    if (!this.canAddDevices) {
      this.snackBar.open('Please complete all device assignments', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Prepare locations and devices data for API
    const locationsData = this.locations.map(location => ({
      name: location.name,
      description: location.description || '',
      level: 0,
      subLocations: location.subLocations?.map(subLocation => ({
        name: subLocation.name,
        description: subLocation.description || '',
        level: 1
      })) || []
    }));

    // Create a map from temporary IDs to location names (backend expects names as keys)
    const tempIdToNameMap = new Map<string, string>();
    this.locations.forEach(location => {
      if (location.id) {
        tempIdToNameMap.set(location.id, location.name);
      }
      location.subLocations?.forEach(subLocation => {
        if (subLocation.id) {
          tempIdToNameMap.set(subLocation.id, subLocation.name);
        }
      });
    });

    const devicesData = this.selectedDevices.map(device => ({
      device_id: device.id,
      location_id: tempIdToNameMap.get(device.assignedLocation || '') || '',
      quantity: device.selectedQuantity || 1,
      unit_price: device.selectedPrice || device.selling_price
    }));

    // Add locations and devices to project
    const requestData = {
      locations: locationsData,
      devices: devicesData
    };

    this.apiService.post(`/projects/${this.data.projectId}/add-devices`, requestData).subscribe({
      next: (response) => {
        this.snackBar.open('Devices added to project successfully', 'Close', { duration: 3000 });
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        console.error('Failed to add devices to project:', error);
        this.snackBar.open('Failed to add devices to project', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getSelectedDeviceNames(): string {
    return this.selectedDevices.map(d => d.name).join(', ');
  }

  // Method to handle device assignment changes
  onDeviceAssignmentChange(): void {
    this.refreshCachedValues();
  }

  // Method to handle quantity changes
  onQuantityChange(): void {
    this.refreshCachedValues();
  }

  // Method to handle price changes
  onPriceChange(): void {
    this.refreshCachedValues();
  }
}