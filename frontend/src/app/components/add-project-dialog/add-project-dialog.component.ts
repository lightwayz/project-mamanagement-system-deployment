import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CreateProjectRequest, Project, CreateProjectLocationRequest, CreateProjectDeviceRequest, DeviceSelectionItem } from '../../models/project.model';
import { Client } from '../../models/client.model';
import { User } from '../../models/user.model';
import { BuildSystem } from '../../models/build-system.model';
import { AddClientDialogComponent } from '../add-client-dialog/add-client-dialog.component';

@Component({
  selector: 'app-add-project-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>assignment</mat-icon>
        </div>
        <div class="header-text">
          <h2>Create New Project</h2>
          <p>Set up a new smart home installation project with devices</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content class="stepper-content">
      <mat-stepper #stepper linear="false" orientation="horizontal" class="project-stepper">
        
        <!-- Step 1: Project Information -->
        <mat-step [stepControl]="projectForm" [completed]="projectForm.valid">
          <form [formGroup]="projectForm">
            <ng-template matStepLabel>Project Information</ng-template>
            
            <div class="step-content">
              <div class="step-header">
                <mat-icon class="step-icon">info</mat-icon>
                <div class="step-title">
                  <h3>Basic Project Details</h3>
                  <p>Enter the fundamental information about your project</p>
                </div>
              </div>

              <div class="form-field">
                <label class="field-label">Project Name *</label>
                <input type="text" 
                       class="form-input" 
                       formControlName="name" 
                       placeholder="Enter project name">
                <div *ngIf="projectForm.get('name')?.hasError('required') && projectForm.get('name')?.touched" 
                     class="error-message">
                  Project name is required
                </div>
              </div>

              <div class="form-field">
                <label class="field-label">Description *</label>
                <textarea class="form-input form-textarea" 
                          formControlName="description" 
                          rows="3" 
                          placeholder="Project description and scope"></textarea>
                <div *ngIf="projectForm.get('description')?.hasError('required') && projectForm.get('description')?.touched" 
                     class="error-message">
                  Project description is required
                </div>
              </div>

              <div class="client-section">
                <h4 class="subsection-title">Client Assignment</h4>
                <div class="client-field-row">
                  <div class="form-field client-field">
                    <label class="field-label">Client</label>
                    <input type="text"
                           class="form-input"
                           formControlName="clientSearch"
                           [matAutocomplete]="auto"
                           placeholder="Search or select client">
                    <mat-autocomplete #auto="matAutocomplete" 
                                     [displayWith]="displayClientFn"
                                     (optionSelected)="onClientSelected($event)"
                                     class="client-autocomplete">
                      <mat-option *ngFor="let client of filteredClients | async" [value]="client" class="client-option">
                        <div class="client-option-content">
                          <div class="client-main-info">
                            <strong>{{client.name}}</strong>
                            <span class="client-company" *ngIf="client.company"> ({{client.company}})</span>
                          </div>
                          <div class="client-contact-info">
                            <span class="client-email">{{client.email}}</span>
                            <span class="client-phone" *ngIf="client.phone"> • {{client.phone}}</span>
                          </div>
                        </div>
                      </mat-option>
                      <mat-option *ngIf="(filteredClients | async)?.length === 0" disabled>
                        <div class="no-results">No clients found</div>
                      </mat-option>
                    </mat-autocomplete>
                  </div>
                  
                  <button type="button" mat-raised-button color="accent" 
                          (click)="openAddClientDialog()" class="add-client-btn">
                    New Client
                  </button>
                </div>
                
                <div *ngIf="selectedClient" class="selected-client">
                  <mat-card class="client-card">
                    <mat-card-content>
                      <div class="client-info">
                        <h5>{{selectedClient.name}}</h5>
                        <p>{{selectedClient.email}} | {{selectedClient.phone}}</p>
                      </div>
                      <button mat-icon-button (click)="clearClient()" matTooltip="Remove client">
                        <mat-icon>close</mat-icon>
                      </button>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field half-width">
                  <label class="field-label">Start Date</label>
                  <input type="date" class="form-input" formControlName="start_date">
                </div>
                <div class="form-field half-width">
                  <label class="field-label">End Date</label>
                  <input type="date" class="form-input" formControlName="end_date">
                </div>
              </div>

              <div class="form-field" *ngIf="currentUser?.role === 'admin'">
                <label class="field-label">Salesperson</label>
                <select class="form-input" formControlName="salesperson_id">
                  <option value="">No salesperson assigned</option>
                  <option *ngFor="let user of salespeople" [value]="user.id">
                    {{user.name}} - {{user.email}}
                  </option>
                </select>
              </div>

              <div class="logo-upload-section">
                <h4 class="subsection-title">
                  <mat-icon>image</mat-icon>
                  Logo & Images (Optional)
                </h4>
                <p class="section-description">Upload logos and project images for the PDF proposal</p>

                <div class="form-row">
                  <div class="form-field half-width">
                    <label class="field-label">Company Logo</label>
                    <div class="file-upload-container">
                      <input type="file"
                             accept="image/jpeg,image/jpg,image/png,image/gif"
                             (change)="onCompanyLogoSelect($event)"
                             #companyLogoInput
                             style="display: none">
                      <button type="button"
                              mat-stroked-button
                              (click)="companyLogoInput.click()"
                              class="upload-btn">
                        <mat-icon>upload</mat-icon>
                        Choose Logo
                      </button>
                      <div *ngIf="companyLogoPreview" class="image-preview">
                        <img [src]="companyLogoPreview" alt="Company Logo Preview">
                        <button type="button"
                                mat-icon-button
                                color="warn"
                                (click)="removeCompanyLogo()"
                                class="remove-image-btn">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="form-field half-width">
                    <label class="field-label">Client Logo</label>
                    <div class="file-upload-container">
                      <input type="file"
                             accept="image/jpeg,image/jpg,image/png,image/gif"
                             (change)="onClientLogoSelect($event)"
                             #clientLogoInput
                             style="display: none">
                      <button type="button"
                              mat-stroked-button
                              (click)="clientLogoInput.click()"
                              class="upload-btn">
                        <mat-icon>upload</mat-icon>
                        Choose Logo
                      </button>
                      <div *ngIf="clientLogoPreview" class="image-preview">
                        <img [src]="clientLogoPreview" alt="Client Logo Preview">
                        <button type="button"
                                mat-icon-button
                                color="warn"
                                (click)="removeClientLogo()"
                                class="remove-image-btn">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-field">
                  <label class="field-label">Project/Property Image</label>
                  <div class="file-upload-container">
                    <input type="file"
                           accept="image/jpeg,image/jpg,image/png,image/gif"
                           (change)="onProjectImageSelect($event)"
                           #projectImageInput
                           style="display: none">
                    <button type="button"
                            mat-stroked-button
                            (click)="projectImageInput.click()"
                            class="upload-btn">
                      <mat-icon>upload</mat-icon>
                      Choose Image
                    </button>
                    <div *ngIf="projectImagePreview" class="image-preview large">
                      <img [src]="projectImagePreview" alt="Project Image Preview">
                      <button type="button"
                              mat-icon-button
                              color="warn"
                              (click)="removeProjectImage()"
                              class="remove-image-btn">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-flat-button 
                        color="primary"
                        [disabled]="!canProceedToDevices()"
                        matStepperNext>
                  Next: Select Devices
                </button>
              </div>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Device Selection -->
        <mat-step [optional]="isDeviceStepOptional" [completed]="deviceStepCompleted">
          <form [formGroup]="locationsForm">
            <ng-template matStepLabel>Device Selection</ng-template>
            
            <div class="step-content">
              <div class="step-header">
                <mat-icon class="step-icon">devices</mat-icon>
                <div class="step-title">
                  <h3>Select Project Devices</h3>
                  <p>Choose devices from inventory or import from a build system template</p>
                </div>
              </div>

              <!-- Build System Import Section -->
              <div class="build-system-import-section" *ngIf="availableBuildSystems.length > 0">
                <div class="import-header">
                  <h4 class="subsection-title">Import from Build System</h4>
                  <p class="import-description">
                    Quickly start with a pre-configured system template that includes devices and locations
                  </p>
                </div>

                <div class="import-controls" *ngIf="!selectedBuildSystem">
                  <div class="build-system-selector">
                    <mat-form-field appearance="outline" class="build-system-field">
                      <mat-label>Choose Build System Template</mat-label>
                      <mat-select (selectionChange)="onImportBuildSystem($event.value)">
                        <mat-option *ngFor="let system of availableBuildSystems" [value]="system">
                          <div class="build-system-option">
                            <div class="system-main-info">
                              <strong>{{ system.name }}</strong>
                              <span class="system-cost">{{ system.total_cost | appCurrency }}</span>
                            </div>
                            <div class="system-details" *ngIf="system.description">
                              {{ system.description | slice:0:60 }}<span *ngIf="system.description.length > 60">...</span>
                            </div>
                            <div class="system-meta">
                              {{ system.locations_count }} locations • Created by {{ system.creator?.name }}
                            </div>
                          </div>
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="imported-system-info" *ngIf="selectedBuildSystem">
                  <mat-card class="imported-card">
                    <mat-card-content>
                      <div class="imported-header">
                        <div class="imported-details">
                          <h5>{{ selectedBuildSystem.name }}</h5>
                          <p>{{ selectedBuildSystem.description }}</p>
                          <div class="imported-stats">
                            <span class="stat">{{ selectedDevices.length }} devices</span>
                            <span class="stat">{{ locations.length }} locations</span>
                            <span class="stat">{{ totalProjectCost | appCurrency }}</span>
                          </div>
                        </div>
                        <button mat-icon-button (click)="clearBuildSystemImport()" matTooltip="Clear import" class="clear-import-btn">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="import-divider">
                  <span class="divider-text">OR</span>
                </div>
              </div>

              <div class="location-setup">
                <div class="location-header">
                  <h4 class="subsection-title">Location Setup</h4>
                  <button type="button" 
                          mat-raised-button 
                          color="primary" 
                          (click)="addLocation()" 
                          class="add-location-btn">
                    <mat-icon>add</mat-icon>
                    Add Location
                  </button>
                </div>
                
                <div class="locations-container">
                  <div *ngFor="let location of locations; let i = index; trackBy: trackByLocationId"
                       class="location-item"
                       [class.location-item-invalid]="!isLocationValid(location)">

                    <div class="location-header-row">
                      <div class="location-number">
                        <button type="button"
                                mat-icon-button
                                (click)="toggleLocationExpansion(i)"
                                class="expand-toggle"
                                [matTooltip]="location.isExpanded ? 'Collapse' : 'Expand'">
                          <mat-icon>{{location.isExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
                        </button>
                        <mat-icon>location_on</mat-icon>
                        <span>Location {{i + 1}}</span>
                      </div>
                      <div class="location-actions">
                        <button type="button"
                                mat-stroked-button
                                color="primary"
                                (click)="addSubLocation(i)"
                                matTooltip="Add sub-location"
                                class="add-sub-location-btn">
                          <mat-icon>add_location_alt</mat-icon>
                          Sub-Location
                        </button>
                        <button type="button"
                                mat-icon-button
                                color="warn"
                                *ngIf="locations.length > 1"
                                (click)="removeLocation(i)"
                                matTooltip="Remove location"
                                class="remove-location-btn">
                          <mat-icon>remove_circle</mat-icon>
                        </button>
                      </div>
                    </div>

                    <div class="form-row" *ngIf="location.isExpanded">
                      <div class="form-field half-width">
                        <label class="field-label">Location Name *</label>
                        <input type="text"
                               class="form-input"
                               [value]="location.name"
                               (input)="onLocationNameChange(i, $event)"
                               placeholder="e.g., Living Room, Kitchen, Master Bedroom"
                               [class.form-input-error]="!location.name.trim()">
                        <div *ngIf="!location.name.trim()" class="error-message">
                          Location name is required
                        </div>
                      </div>
                      <div class="form-field half-width">
                        <label class="field-label">Description</label>
                        <input type="text"
                               class="form-input"
                               [value]="location.description"
                               (input)="onLocationDescriptionChange(i, $event)"
                               placeholder="Optional description">
                      </div>
                    </div>

                    <!-- Sub-locations Section -->
                    <div class="sub-locations-section" *ngIf="location.isExpanded && location.subLocations && location.subLocations.length > 0">
                      <div class="sub-location-header">
                        <h5 class="sub-location-title">
                          <mat-icon>subdirectory_arrow_right</mat-icon>
                          Sub-Locations
                        </h5>
                      </div>

                      <div class="sub-locations-container">
                        <div *ngFor="let subLocation of location.subLocations; let j = index"
                             class="sub-location-item">

                          <div class="sub-location-header-row">
                            <div class="sub-location-number">
                              <mat-icon>subdirectory_arrow_right</mat-icon>
                              <span>{{location.name}} - Sub Area {{j + 1}}</span>
                            </div>
                            <button type="button"
                                    mat-icon-button
                                    color="warn"
                                    (click)="removeSubLocation(i, j)"
                                    matTooltip="Remove sub-location"
                                    class="remove-sub-location-btn">
                              <mat-icon>remove_circle_outline</mat-icon>
                            </button>
                          </div>

                          <div class="form-row">
                            <div class="form-field half-width">
                              <label class="field-label">Sub-Location Name *</label>
                              <input type="text"
                                     class="form-input"
                                     [value]="subLocation.name"
                                     (input)="onSubLocationNameChange(i, j, $event)"
                                     placeholder="e.g., TV Area, Dining Area, Kitchen Island"
                                     [class.form-input-error]="!subLocation.name?.trim()">
                              <div *ngIf="!subLocation.name?.trim()" class="error-message">
                                Sub-location name is required
                              </div>
                            </div>
                            <div class="form-field half-width">
                              <label class="field-label">Description</label>
                              <input type="text"
                                     class="form-input"
                                     [value]="subLocation.description"
                                     (input)="onSubLocationDescriptionChange(i, j, $event)"
                                     placeholder="Optional description">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="device-selection-container">
                <app-device-selector
                  [selectedDevices]="selectedDevices"
                  [locations]="locations"
                  [allowMultipleSelection]="true"
                  [showPriceOverride]="true"
                  (devicesSelected)="onDevicesSelected($event)"
                  (selectionChanged)="onDeviceSelectionChanged($event)">
                </app-device-selector>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>
                  Back
                </button>
                <button mat-flat-button 
                        color="primary"
                        [disabled]="!canProceedToReview()"
                        matStepperNext>
                  Next: Review
                </button>
                <button mat-stroked-button 
                        *ngIf="isDeviceStepOptional"
                        matStepperNext>
                  Skip Devices
                </button>
              </div>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Review and Confirm -->
        <mat-step>
          <ng-template matStepLabel>Review & Create</ng-template>
          
          <div class="step-content">
            <div class="step-header">
              <mat-icon class="step-icon">preview</mat-icon>
              <div class="step-title">
                <h3>Review Project Details</h3>
                <p>Confirm all information before creating the project</p>
              </div>
            </div>

            <div class="review-sections">
              <!-- Project Information Review -->
              <mat-card class="review-card">
                <mat-card-header>
                  <mat-card-title>Project Information</mat-card-title>
                  <button mat-icon-button (click)="goToStep(0)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="review-item">
                    <strong>Name:</strong> {{projectForm.get('name')?.value}}
                  </div>
                  <div class="review-item">
                    <strong>Description:</strong> {{projectForm.get('description')?.value}}
                  </div>
                  <div class="review-item" *ngIf="selectedClient">
                    <strong>Client:</strong> {{selectedClient.name}}
                  </div>
                  <div class="review-item" *ngIf="projectForm.get('start_date')?.value">
                    <strong>Start Date:</strong> {{projectForm.get('start_date')?.value}}
                  </div>
                  <div class="review-item" *ngIf="projectForm.get('end_date')?.value">
                    <strong>End Date:</strong> {{projectForm.get('end_date')?.value}}
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Device Review -->
              <mat-card class="review-card" *ngIf="selectedDevices.length > 0">
                <mat-card-header>
                  <mat-card-title>Selected Devices ({{selectedDevices.length}})</mat-card-title>
                  <div class="total-cost">
                    <strong>Total: {{ totalProjectCost | appCurrency }}</strong>
                  </div>
                  <button mat-icon-button (click)="goToStep(1)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="devices-by-location">
                    <div class="location-group" *ngFor="let locationName of getLocationNames()">
                      <h4 class="location-title">
                        <mat-icon>location_on</mat-icon>
                        {{locationName}}
                      </h4>
                      <div class="device-list">
                        <div class="device-item" *ngFor="let device of getDevicesForLocation(locationName)">
                          <div class="device-info">
                            <strong>{{device.name}}</strong>
                            <div class="device-details">
                              {{device.brand}} {{device.model}} | Category: {{device.category}}
                            </div>
                          </div>
                          <div class="device-pricing">
                            <div>Qty: {{device.selectedQuantity}}</div>
                            <div>Price: {{ device.selectedPrice | appCurrency }}</div>
                            <div class="device-total"><strong>{{ (device.selectedQuantity || 1) * (device.selectedPrice || device.selling_price) | appCurrency }}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <div class="no-devices-message" *ngIf="selectedDevices.length === 0">
                <mat-icon>info</mat-icon>
                <p>No devices selected. You can add devices to the project later.</p>
              </div>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>
                Back
              </button>
              <button mat-flat-button 
                      color="primary"
                      [disabled]="isLoading"
                      (click)="onSave()"
                      class="create-btn">
                <mat-icon *ngIf="isLoading" class="loading-icon">refresh</mat-icon>
                {{isLoading ? 'Creating...' : 'Create Project'}}
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
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
      background: linear-gradient(135deg, #20bf6b 0%, #01a3a4 100%);
      color: white;
      margin: -24px -24px 0 -24px;
    }

    .stepper-content {
      padding: 0 !important;
      max-height: 80vh;
      overflow: visible;
    }

    .project-stepper {
      background: transparent;
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
      color: #20bf6b;
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

    .subsection-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3436;
      margin: 20px 0 12px 0;
    }

    .step-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
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
    
    .add-location-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      height: 40px;
      border-radius: 20px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(32, 191, 107, 0.2);
      transition: all 0.2s ease;
    }
    
    .add-location-btn:hover {
      box-shadow: 0 4px 8px rgba(32, 191, 107, 0.3);
      transform: translateY(-1px);
    }
    
    .locations-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .location-item {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
    }
    
    .location-item:hover {
      border-color: #20bf6b;
      box-shadow: 0 2px 8px rgba(32, 191, 107, 0.1);
    }
    
    .location-item-invalid {
      border-color: #f44336 !important;
      background: #fef7f7;
    }
    
    .location-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .location-number {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #2d3436;
    }

    .location-number mat-icon {
      color: #20bf6b;
      font-size: 20px;
    }

    .location-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .expand-toggle {
      margin-right: 4px;
      color: #6c757d;
    }

    .add-sub-location-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      min-height: 32px;
      height: 32px;
    }

    .add-sub-location-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Sub-location styles */
    .sub-locations-section {
      margin-top: 16px;
      padding-left: 24px;
      border-left: 2px solid #e9ecef;
    }

    .sub-location-header {
      margin-bottom: 12px;
    }

    .sub-location-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #6c757d;
    }

    .sub-location-title mat-icon {
      font-size: 18px;
      color: #20bf6b;
    }

    .sub-locations-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sub-location-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      margin-left: 16px;
    }

    .sub-location-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .sub-location-number {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #6c757d;
    }

    .sub-location-number mat-icon {
      font-size: 16px;
      color: #95a5a6;
    }

    .remove-sub-location-btn {
      color: #f44336;
      width: 32px;
      height: 32px;
    }

    .remove-sub-location-btn mat-icon {
      font-size: 18px;
    }
    
    .remove-location-btn {
      color: #f44336;
      transition: all 0.2s ease;
    }
    
    .remove-location-btn:hover {
      background-color: #ffebee;
      transform: scale(1.1);
    }
    
    .form-input-error {
      border-color: #f44336 !important;
      background-color: #fef7f7 !important;
    }

    .device-selection-container {
      margin: 24px 0;
    }

    /* Build System Import Styles */
    .build-system-import-section {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      margin-bottom: 32px;
    }

    .import-header {
      margin-bottom: 20px;
    }

    .import-description {
      color: #6c757d;
      font-size: 14px;
      margin: 8px 0 0 0;
    }

    .import-controls {
      margin-bottom: 20px;
    }

    .build-system-field {
      width: 100%;
      max-width: 500px;
    }

    .build-system-option {
      padding: 8px 0;
      line-height: 1.4;
    }

    .system-main-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .system-main-info strong {
      color: #2d3436;
      font-size: 15px;
    }

    .system-cost {
      color: #20bf6b;
      font-weight: 600;
      font-size: 14px;
    }

    .system-details {
      color: #6c757d;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .system-meta {
      color: #95a5a6;
      font-size: 12px;
      font-style: italic;
    }

    .imported-card {
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
      border: 1px solid #20bf6b;
      border-radius: 12px;
    }

    .imported-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .imported-details h5 {
      margin: 0 0 8px 0;
      color: #2d3436;
      font-weight: 600;
      font-size: 16px;
    }

    .imported-details p {
      margin: 0 0 12px 0;
      color: #6c757d;
      font-size: 14px;
    }

    .imported-stats {
      display: flex;
      gap: 16px;
    }

    .imported-stats .stat {
      background: rgba(32, 191, 107, 0.1);
      color: #20bf6b;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .clear-import-btn {
      color: #f44336;
    }

    .import-divider {
      text-align: center;
      position: relative;
      margin: 24px 0;
    }

    .import-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #dee2e6;
    }

    .divider-text {
      background: #f8f9fa;
      color: #6c757d;
      padding: 0 16px;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .review-sections {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .review-card {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .review-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .review-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3436;
      margin: 0;
    }

    .total-cost {
      font-size: 16px;
      color: #20bf6b;
    }

    .review-item {
      padding: 8px 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .review-item:last-child {
      border-bottom: none;
    }

    .devices-by-location {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .location-group {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .location-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      font-size: 16px;
      font-weight: 600;
      color: #2d3436;
    }

    .location-title mat-icon {
      color: #20bf6b;
      font-size: 20px;
    }

    .device-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .device-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .device-info {
      flex: 1;
    }

    .device-info strong {
      font-size: 14px;
      color: #2d3436;
    }

    .device-details {
      font-size: 12px;
      color: #6c757d;
      margin-top: 4px;
    }

    .device-pricing {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      font-size: 12px;
      color: #6c757d;
    }

    .device-total {
      color: #20bf6b;
      font-size: 14px;
    }

    .no-devices-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      color: #6c757d;
      text-align: center;
      justify-content: center;
    }

    .no-devices-message mat-icon {
      font-size: 24px;
      color: #adb5bd;
    }

    .create-btn {
      background: linear-gradient(135deg, #20bf6b 0%, #01a3a4 100%);
      color: white;
      min-width: 160px;
      height: 48px;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
    
    .project-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 650px;
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
      border-color: #20bf6b;
      box-shadow: 0 0 0 3px rgba(32, 191, 107, 0.1);
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
    
    .client-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }
    
    .section-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .client-field-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .client-field {
      flex: 1;
    }
    
    .add-client-btn {
      margin-top: 8px !important;
      white-space: nowrap !important;
      border-radius: 20px !important;
      padding: 8px 20px !important;
      min-height: 44px !important;
      height: auto !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 140px !important;
      width: auto !important;
      flex-shrink: 0 !important;
      text-overflow: unset !important;
      overflow: visible !important;
      color: white !important;
      background-color: #20bf6b !important;
      border: none !important;
    }
    
    .add-client-btn .mat-button-wrapper {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      white-space: nowrap !important;
      text-overflow: unset !important;
      overflow: visible !important;
      color: white !important;
    }
    
    .selected-client {
      margin-top: 12px;
    }
    
    .client-card {
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
      border: 1px solid #20bf6b;
      border-radius: 12px;
    }
    
    .client-card mat-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px !important;
    }
    
    .client-info h4 {
      margin: 0 0 4px 0;
      color: #2d3436;
      font-weight: 600;
    }
    
    .client-info p {
      margin: 0;
      font-size: 14px;
      color: #636e72;
    }

    /* Autocomplete styling */
    .client-option {
      padding: 12px 16px !important;
      border-bottom: 1px solid #f0f0f0;
      min-height: auto !important;
      line-height: 1.4;
    }
    
    .client-option:last-child {
      border-bottom: none;
    }
    
    .client-option-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    
    .client-main-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .client-company {
      color: #7f8c8d;
      font-weight: 400;
      font-style: italic;
    }
    
    .client-contact-info {
      font-size: 13px;
      color: #95a5a6;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .client-email {
      color: #3498db;
    }
    
    .client-phone {
      color: #27ae60;
    }
    
    .no-results {
      text-align: center;
      color: #95a5a6;
      font-style: italic;
      padding: 16px;
    }
    
    /* Dark theme support for autocomplete */
    :host-context(.dark-theme) .client-option {
      border-bottom-color: #444;
    }
    
    :host-context(.dark-theme) .client-main-info {
      color: #ecf0f1;
    }
    
    :host-context(.dark-theme) .client-company {
      color: #bdc3c7;
    }
    
    :host-context(.dark-theme) .client-contact-info {
      color: #7f8c8d;
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
      background: linear-gradient(135deg, #20bf6b 0%, #01a3a4 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(32, 191, 107, 0.3);
      transition: all 0.3s ease;
      min-width: 160px;
      font-size: 16px;
      cursor: pointer;
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(32, 191, 107, 0.4);
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
    
    .cancel-btn:hover {
      border-color: #ccc;
      background: #f8f9fa;
    }
    
    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(32, 191, 107, 0.4);
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

    /* Logo Upload Section Styles */
    .logo-upload-section {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      margin: 24px 0;
    }

    .logo-upload-section .subsection-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2d3436;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .logo-upload-section .subsection-title mat-icon {
      color: #20bf6b;
    }

    .section-description {
      color: #6c757d;
      font-size: 14px;
      margin: 0 0 20px 0;
    }

    .file-upload-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      border: 2px dashed #20bf6b;
      background: white;
      color: #20bf6b;
      font-weight: 500;
      transition: all 0.2s ease;
      width: fit-content;
    }

    .upload-btn:hover {
      background: #e8f5e8;
      border-color: #01a3a4;
    }

    .upload-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .image-preview {
      position: relative;
      width: 150px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e9ecef;
      background: white;
    }

    .image-preview.large {
      width: 300px;
      height: 200px;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }

    .remove-image-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 28px;
      height: 28px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
    }

    .remove-image-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .remove-image-btn:hover {
      background: rgba(244, 67, 54, 1);
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
      
      .project-form {
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
      
      .field-label {
        font-size: 15px;
      }
      
      .client-section {
        padding: 16px;
        gap: 14px;
      }
      
      .client-field-row {
        flex-direction: column;
        gap: 12px;
      }
      
      .add-client-btn {
        margin-top: 0 !important;
        width: 100% !important;
        height: 48px !important;
        border-radius: 24px !important;
        min-height: 48px !important;
        padding: 12px 20px !important;
        font-size: 16px !important;
        min-width: unset !important;
      }
      
      .location-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .add-location-btn {
        width: 100% !important;
        height: 48px !important;
      }
      
      .location-item {
        padding: 12px;
      }
      
      .location-header-row {
        margin-bottom: 10px;
      }
      
      .remove-location-btn {
        padding: 8px;
      }
      
      .add-client-btn .mat-button-wrapper {
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: unset !important;
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
      
      .project-form {
        gap: 16px;
      }
      
      .form-input {
        padding: 12px 14px;
      }
      
      .client-section {
        padding: 14px;
      }
      
      .dialog-actions {
        padding: 12px !important;
        margin: 0 -12px -12px !important;
      }
    }

    /* ========================================
       DARK THEME OVERRIDES - COMPREHENSIVE FIX
       ======================================== */
    :host-context(.dark-theme) {
      /* Override ALL section backgrounds with light colors */
      .client-section,
      .logo-upload-section,
      .project-info-section,
      .form-section,
      .step-content,
      .import-section,
      .location-setup-section,
      .device-selection-section,
      .location-setup,
      .location-item,
      .sub-location-item,
      .build-system-import-section,
      .divider-text,
      .step-header,
      .location-header,
      .location-detail-row,
      .imported-details,
      .dialog-actions,
      .cancel-btn,
      .upload-btn,
      .image-preview {
        background: #2a2a2a !important;
        border-color: #444 !important;
      }

      /* Invalid states should still show as invalid */
      .location-item-invalid {
        background: rgba(244, 67, 54, 0.1) !important;
        border-color: #f44336 !important;
      }

      /* Override all hardcoded dark text colors to white/light */
      .step-title h3,
      .step-title p,
      .subsection-title,
      .field-label,
      .section-description,
      .import-description,
      .client-main-info,
      .system-main-info,
      .imported-details h5,
      .location-card h5,
      .device-card-title,
      .summary-label,
      .form-section-title,
      .section-title,
      h4,
      h3,
      h2,
      label,
      .client-field-row label,
      .form-field label {
        color: rgba(255, 255, 255, 0.95) !important;
      }

      .step-description,
      .client-email,
      .client-phone,
      .system-description,
      .system-meta,
      .device-category,
      .summary-sublabel,
      .no-devices-message {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* Override all light backgrounds to dark backgrounds */
      .form-input,
      .form-textarea,
      .file-upload-container,
      .client-card,
      .imported-card,
      .location-card,
      .device-card,
      .device-grid,
      .review-section,
      .summary-row,
      .build-system-selector {
        background: #2a2a2a !important;
        color: rgba(255, 255, 255, 0.95) !important;
        border-color: #444 !important;
      }

      /* Error states in dark theme */
      .error-message,
      .form-input.error {
        background-color: rgba(244, 67, 54, 0.1) !important;
        border-color: #f44336 !important;
        color: #ff5252 !important;
      }

      /* Step header border */
      .step-header {
        border-bottom-color: #444 !important;
      }

      /* Placeholder text */
      .form-input::placeholder,
      .form-textarea::placeholder {
        color: rgba(255, 255, 255, 0.5) !important;
      }

      /* Divider */
      .import-divider::before,
      .import-divider::after {
        background: #444 !important;
      }

      .divider-text {
        background: var(--surface-color) !important;
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* Selected items */
      .selected-client,
      .imported-system-info {
        background: transparent !important;
      }

      /* Stats and meta information */
      .stat,
      .system-cost,
      .device-cost {
        color: #20bf6b !important;
      }

      /* Buttons maintain their styling but ensure visibility */
      .upload-btn,
      .add-client-btn,
      .cancel-btn {
        background-color: #424242 !important;
        color: rgba(255, 255, 255, 0.95) !important;
        border-color: #666 !important;
      }

      .upload-btn:hover,
      .add-client-btn:hover,
      .cancel-btn:hover {
        background-color: #555 !important;
        border-color: #888 !important;
      }

      /* Disabled button states */
      .save-btn:disabled,
      button:disabled {
        background-color: #333 !important;
        color: rgba(255, 255, 255, 0.4) !important;
        border-color: #444 !important;
      }

      /* Remove/clear buttons */
      .remove-image-btn,
      .clear-import-btn {
        background-color: rgba(244, 67, 54, 0.1) !important;
        color: #f44336 !important;
      }

      /* Image previews */
      .image-preview {
        border-color: #444 !important;
        background: #1a1a1a !important;
      }

      /* Device selection grid */
      .device-option-content {
        background: #2a2a2a !important;
        border-color: #444 !important;
      }

      .device-option-content:hover {
        background: #333 !important;
        border-color: #20bf6b !important;
      }

      /* Location inputs */
      .location-inputs {
        background: #2a2a2a !important;
        border-color: #444 !important;
      }

      /* Summary section backgrounds */
      .project-summary,
      .summary-card {
        background: #2a2a2a !important;
        border-color: #444 !important;
      }

      /* Build system options */
      .build-system-option {
        color: rgba(255, 255, 255, 0.95) !important;
      }

      .system-details {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* System main info strong text */
      .system-main-info strong {
        color: rgba(255, 255, 255, 0.95) !important;
      }

      .system-meta {
        color: rgba(255, 255, 255, 0.6) !important;
      }

      /* Build system field styling */
      .build-system-field {
        background: var(--surface-color) !important;
      }

      /* Ensure select dropdowns are visible */
      select.form-input {
        background-color: #2a2a2a !important;
        color: rgba(255, 255, 255, 0.95) !important;
        border-color: #444 !important;
      }

      select.form-input option {
        background-color: #2a2a2a !important;
        color: rgba(255, 255, 255, 0.95) !important;
      }

      /* Review card dark mode */
      .review-card {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
      }

      .review-card mat-card-header {
        background: var(--header-bg) !important;
        border-bottom-color: var(--border-color) !important;
      }

      .review-card mat-card-title {
        color: var(--text-primary) !important;
      }

      .review-item {
        border-bottom-color: var(--border-color) !important;
        color: var(--text-primary) !important;
      }

      .location-group {
        border-color: var(--border-color) !important;
        background: var(--surface-color) !important;
      }

      .location-title {
        background: var(--header-bg) !important;
        border-bottom-color: var(--border-color) !important;
        color: var(--text-primary) !important;
      }

      .device-item {
        background: var(--header-bg) !important;
        border-color: var(--border-color) !important;
      }

      .device-info strong {
        color: var(--text-primary) !important;
      }

      .device-details {
        color: var(--text-secondary) !important;
      }

      .no-devices-message {
        background: var(--surface-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-secondary) !important;
      }

      .no-devices-message mat-icon {
        color: var(--text-secondary) !important;
      }
    }
  `]
})
export class AddProjectDialogComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  
  projectForm: FormGroup;
  locationsForm: FormGroup;
  isLoading = false;
  clients: Client[] = [];
  salespeople: User[] = [];
  selectedClient: Client | null = null;
  currentUser: User | null = null;
  filteredClients: Observable<Client[]> = new Observable();
  
  // Device selection data
  selectedDevices: DeviceSelectionItem[] = [];
  projectLocations: CreateProjectLocationRequest[] = [];
  totalProjectCost = 0;

  // Build system import
  availableBuildSystems: BuildSystem[] = [];
  selectedBuildSystem: BuildSystem | null = null;
  
  // Location management with sub-location support
  locations: { name: string; description: string; id?: string; level?: number; parent_location_id?: string; subLocations?: any[]; isExpanded?: boolean }[] = [];
  
  // Stepper control
  isDeviceStepOptional = true;
  deviceStepCompleted = false;

  // Logo and image upload properties
  companyLogoFile: File | null = null;
  clientLogoFile: File | null = null;
  projectImageFile: File | null = null;
  companyLogoPreview: string | null = null;
  clientLogoPreview: string | null = null;
  projectImagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddProjectDialogComponent>,
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authService.getCurrentUser();
    
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      clientSearch: [''],
      start_date: [''],
      end_date: [''],
      salesperson_id: [this.currentUser?.role === 'salesperson' ? this.currentUser.id : '']
    });
    
    this.locationsForm = this.fb.group({
      defaultLocation: ['Main Location', [Validators.required]],
      defaultLocationDescription: ['']
    });
    
    // Initialize with default location
    this.locations = [
      {
        name: 'Main Location',
        description: '',
        id: this.generateLocationId(),
        level: 0,
        subLocations: [],
        isExpanded: true
      }
    ];
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadBuildSystems();
    if (this.currentUser?.role === 'admin') {
      this.loadSalespeople();
    }
    this.setupClientAutocomplete();
  }

  loadClients(): void {
    this.apiService.get<{data: Client[]}>('/clients').subscribe({
      next: (response) => {
        this.clients = response.data || [];
        console.log('Loaded clients:', this.clients);
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
        this.snackBar.open('Failed to load clients', 'Close', { duration: 3000 });
      }
    });
  }

  loadSalespeople(): void {
    this.apiService.get<User[]>('/users?role=salesperson').subscribe({
      next: (users) => {
        this.salespeople = users;
      },
      error: (error) => {
        console.error('Failed to load salespeople:', error);
      }
    });
  }

  loadBuildSystems(): void {
    this.apiService.get<{data: BuildSystem[]}>('/build-systems', { active: true }).subscribe({
      next: (response) => {
        this.availableBuildSystems = response.data || [];
      },
      error: (error) => {
        console.error('Failed to load build systems:', error);
      }
    });
  }

  setupClientAutocomplete(): void {
    this.filteredClients = this.projectForm.get('clientSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit when value actually changes
      map(value => {
        const searchValue = typeof value === 'string' ? value : value?.name || '';
        console.log('Searching clients with:', searchValue);
        const filtered = this._filterClients(searchValue);
        console.log('Filtered results:', filtered);
        return filtered;
      })
    );
  }

  private _filterClients(value: string): Client[] {
    if (!value || value.trim() === '') {
      // Return all clients if no search value
      return this.clients.slice(0, 50); // Limit to first 50 for performance
    }
    
    const filterValue = value.toLowerCase().trim();
    const filtered = this.clients.filter(client => 
      (client.name && client.name.toLowerCase().includes(filterValue)) ||
      (client.email && client.email.toLowerCase().includes(filterValue)) ||
      (client.company && client.company.toLowerCase().includes(filterValue)) ||
      (client.phone && client.phone.includes(filterValue)) ||
      (client.address && client.address.toLowerCase().includes(filterValue))
    );
    
    // Return top 20 results for better UX
    return filtered.slice(0, 20);
  }

  displayClientFn(client: Client): string {
    return client ? client.name : '';
  }

  onClientSelected(event: any): void {
    this.selectedClient = event.option.value;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.projectForm.get('clientSearch')?.setValue('');
  }

  openAddClientDialog(): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add new client to the array
        this.clients.push(result);

        // Set as selected client
        this.selectedClient = result;

        // Force the autocomplete dropdown to refresh by changing the value
        // Set to temp value first to bypass distinctUntilChanged()
        const searchControl = this.projectForm.get('clientSearch');
        searchControl?.setValue(' '); // Temporary value to force a change
        searchControl?.setValue('');   // Clear to show all clients

        this.snackBar.open('Client added and selected for project', 'Close', {
          duration: 3000
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Device selection handlers
  onDevicesSelected(devices: CreateProjectDeviceRequest[]): void {
    // Update project locations with current location data
    this.updateProjectLocations();
    
    // Group devices by assigned location
    const devicesByLocation = this.groupDevicesByLocation();
    
    // Update each project location with its assigned devices
    this.projectLocations.forEach(location => {
      location.devices = devicesByLocation[location.name] || [];
    });
    
    this.updateProjectCost();
    this.deviceStepCompleted = true;
  }

  onDeviceSelectionChanged(devices: DeviceSelectionItem[]): void {
    this.selectedDevices = devices;
    this.updateProjectCost();
  }

  private updateProjectCost(): void {
    this.totalProjectCost = this.selectedDevices.reduce((total, device) => {
      const quantity = device.selectedQuantity || 1;
      const price = device.selectedPrice || device.selling_price;
      return total + (quantity * price);
    }, 0);
  }

  // Stepper navigation
  goToStep(stepIndex: number): void {
    this.stepper.selectedIndex = stepIndex;
  }

  canProceedToDevices(): boolean {
    return this.projectForm.valid;
  }

  canProceedToReview(): boolean {
    const allLocationsValid = this.locations.every(loc => loc.name.trim().length > 0);
    return this.projectForm.valid && allLocationsValid && (this.deviceStepCompleted || this.isDeviceStepOptional);
  }

  // Save project
  onSave(): void {
    if (this.canProceedToReview()) {
      this.isLoading = true;

      const formValue = this.projectForm.value;

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('name', formValue.name);
      formData.append('description', formValue.description);

      if (this.selectedClient?.id) {
        formData.append('client_id', this.selectedClient.id.toString());
      }
      if (formValue.salesperson_id || this.currentUser?.id) {
        formData.append('salesperson_id', (formValue.salesperson_id || this.currentUser?.id).toString());
      }
      if (formValue.start_date) {
        formData.append('start_date', new Date(formValue.start_date).toISOString().split('T')[0]);
      }
      if (formValue.end_date) {
        formData.append('end_date', new Date(formValue.end_date).toISOString().split('T')[0]);
      }

      // Append logo and image files if selected
      if (this.companyLogoFile) {
        formData.append('company_logo', this.companyLogoFile);
      }
      if (this.clientLogoFile) {
        formData.append('client_logo', this.clientLogoFile);
      }
      if (this.projectImageFile) {
        formData.append('project_image', this.projectImageFile);
      }

      // Append locations if present
      if (this.projectLocations.length > 0) {
        formData.append('locations', JSON.stringify(this.projectLocations));
      }

      this.apiService.post<Project>('/projects', formData).subscribe({
        next: (project) => {
          this.snackBar.open('Project created successfully with devices', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(project);
        },
        error: (error) => {
          console.error('Failed to create project:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to create project', 
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
      this.snackBar.open('Please complete all required steps', 'Close', { duration: 5000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }

  // Location management methods
  generateLocationId(): string {
    return 'loc_' + Math.random().toString(36).substr(2, 9);
  }

  addLocation(): void {
    const newLocation = {
      name: '',
      description: '',
      id: this.generateLocationId(),
      level: 0,
      subLocations: [],
      isExpanded: true
    };
    this.locations.push(newLocation);
  }

  removeLocation(index: number): void {
    if (this.locations.length > 1) {
      this.locations.splice(index, 1);
    } else {
      this.snackBar.open('At least one location is required', 'Close', { duration: 3000 });
    }
  }

  updateLocation(index: number, field: 'name' | 'description', value: string): void {
    if (this.locations[index]) {
      this.locations[index][field] = value;
      this.updateProjectLocations();
    }
  }

  private updateProjectLocations(): void {
    this.projectLocations = [];

    this.locations
      .filter(loc => loc.name.trim()) // Only include locations with names
      .forEach(loc => {
        // Add main location
        const mainLocation: CreateProjectLocationRequest = {
          name: loc.name,
          description: loc.description,
          level: 0,
          devices: []
        };
        this.projectLocations.push(mainLocation);

        // Add sub-locations if they exist
        if (loc.subLocations && loc.subLocations.length > 0) {
          loc.subLocations
            .filter(subLoc => subLoc.name && subLoc.name.trim())
            .forEach(subLoc => {
              const subLocation: CreateProjectLocationRequest = {
                name: subLoc.name,
                description: subLoc.description,
                level: 1,
                devices: []
              };
              this.projectLocations.push(subLocation);
            });
        }
      });
  }

  isLocationValid(location: any): boolean {
    const isMainLocationValid = location.name.trim().length > 0;
    const areSubLocationsValid = !location.subLocations || location.subLocations.length === 0 ||
      location.subLocations.every((subLoc: any) => subLoc.name && subLoc.name.trim().length > 0);
    return isMainLocationValid && areSubLocationsValid;
  }

  trackByLocationId(index: number, location: any): string {
    return location.id || index.toString();
  }

  onLocationNameChange(index: number, event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateLocation(index, 'name', value);
  }

  onLocationDescriptionChange(index: number, event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateLocation(index, 'description', value);
  }

  private groupDevicesByLocation(): { [locationName: string]: CreateProjectDeviceRequest[] } {
    const devicesByLocation: { [locationName: string]: CreateProjectDeviceRequest[] } = {};
    
    this.selectedDevices.forEach(device => {
      const locationName = device.assignedLocation || this.getDefaultLocationName();
      
      if (!devicesByLocation[locationName]) {
        devicesByLocation[locationName] = [];
      }
      
      devicesByLocation[locationName].push({
        device_id: device.id,
        quantity: device.selectedQuantity || 1,
        unit_price: device.selectedPrice || device.selling_price
      });
    });
    
    return devicesByLocation;
  }

  private getDefaultLocationName(): string {
    return this.locations.length > 0 ? this.locations[0].name : 'Main Location';
  }

  getLocationNames(): string[] {
    const locationNames = new Set<string>();
    this.selectedDevices.forEach(device => {
      const locationName = device.assignedLocation || this.getDefaultLocationName();
      locationNames.add(locationName);
    });
    return Array.from(locationNames).sort();
  }

  getDevicesForLocation(locationName: string): DeviceSelectionItem[] {
    return this.selectedDevices.filter(device =>
      (device.assignedLocation || this.getDefaultLocationName()) === locationName
    );
  }

  // Build system import functionality
  onImportBuildSystem(buildSystem: BuildSystem): void {
    if (!buildSystem) return;

    this.selectedBuildSystem = buildSystem;
    this.isLoading = true;

    // Call the backend API to import build system
    this.apiService.post<any>(`/build-systems/${buildSystem.id}/import-to-project`, {}).subscribe({
      next: (response) => {
        // Clear existing locations and devices
        this.locations = [];
        this.selectedDevices = [];

        // Import locations from build system
        if (response.locations && response.locations.length > 0) {
          this.locations = response.locations.map((location: any) => ({
            name: location.name,
            description: location.description || '',
            id: this.generateLocationId(),
            level: 0,
            subLocations: [],
            isExpanded: true
          }));
        } else {
          // Fallback to default location if none returned
          this.locations = [
            {
              name: 'Main Location',
              description: '',
              id: this.generateLocationId(),
              level: 0,
              subLocations: [],
              isExpanded: true
            }
          ];
        }

        // Import devices with location assignments
        if (response.devices && response.devices.length > 0) {
          this.selectedDevices = response.devices.map((device: any) => ({
            ...device,
            selected: true,
            selectedQuantity: device.quantity || 1,
            selectedPrice: device.unit_price || device.selling_price,
            assignedLocation: device.location_name || this.getDefaultLocationName()
          }));
        }

        // Update project cost and locations
        this.updateProjectCost();
        this.updateProjectLocations();
        this.deviceStepCompleted = true;

        this.snackBar.open(
          `Imported ${this.selectedDevices.length} devices from "${buildSystem.name}"`,
          'Close',
          { duration: 3000 }
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error importing build system:', error);
        this.snackBar.open('Failed to import build system', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  clearBuildSystemImport(): void {
    this.selectedBuildSystem = null;
    this.selectedDevices = [];
    this.locations = [
      {
        name: 'Main Location',
        description: '',
        id: this.generateLocationId(),
        level: 0,
        subLocations: [],
        isExpanded: true
      }
    ];
    this.updateProjectCost();
    this.updateProjectLocations();
    this.deviceStepCompleted = false;
  }

  // Sub-location management methods
  addSubLocation(parentIndex: number, name: string = '', description: string = ''): void {
    const parentLocation = this.locations[parentIndex];
    if (!parentLocation.subLocations) {
      parentLocation.subLocations = [];
    }

    const subLocationName = name || `${parentLocation.name} - Sub Area ${parentLocation.subLocations.length + 1}`;

    const newSubLocation = {
      name: subLocationName,
      description: description,
      id: this.generateLocationId(),
      level: 1,
      parent_location_id: parentLocation.id,
      subLocations: [],
      isExpanded: true
    };

    parentLocation.subLocations.push(newSubLocation);
    parentLocation.isExpanded = true;
  }

  removeSubLocation(parentIndex: number, subLocationIndex: number): void {
    const parentLocation = this.locations[parentIndex];
    if (parentLocation.subLocations && parentLocation.subLocations[subLocationIndex]) {
      parentLocation.subLocations.splice(subLocationIndex, 1);
    }
  }

  toggleLocationExpansion(locationIndex: number): void {
    this.locations[locationIndex].isExpanded = !this.locations[locationIndex].isExpanded;
  }

  onSubLocationNameChange(locationIndex: number, subLocationIndex: number, event: any): void {
    const newName = (event.target as HTMLInputElement).value;
    const subLocation = this.locations[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation) {
      subLocation.name = newName;
    }
  }

  onSubLocationDescriptionChange(locationIndex: number, subLocationIndex: number, event: any): void {
    const value = (event.target as HTMLInputElement).value;
    const subLocation = this.locations[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation) {
      subLocation.description = value;
    }
  }

  // Logo and image upload methods
  onCompanyLogoSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      this.companyLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, or GIF)', 'Close', { duration: 3000 });
    }
  }

  onClientLogoSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      this.clientLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.clientLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, or GIF)', 'Close', { duration: 3000 });
    }
  }

  onProjectImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      this.projectImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.projectImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, or GIF)', 'Close', { duration: 3000 });
    }
  }

  removeCompanyLogo(): void {
    this.companyLogoFile = null;
    this.companyLogoPreview = null;
  }

  removeClientLogo(): void {
    this.clientLogoFile = null;
    this.clientLogoPreview = null;
  }

  removeProjectImage(): void {
    this.projectImageFile = null;
    this.projectImagePreview = null;
  }
}