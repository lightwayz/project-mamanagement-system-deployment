import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabGroup } from '@angular/material/tabs';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Project, CreateProjectLocationRequest, CreateProjectDeviceRequest, DeviceSelectionItem } from '../../models/project.model';
import { Client } from '../../models/client.model';
import { User } from '../../models/user.model';
import { AddClientDialogComponent } from '../add-client-dialog/add-client-dialog.component';
import { ProjectDeviceSelectionDialogComponent } from '../project-device-selection-dialog/project-device-selection-dialog.component';

@Component({
  selector: 'app-edit-project-dialog',
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>edit</mat-icon>
        </div>
        <div class="header-text">
          <h2>Edit Project</h2>
          <p>Update project details and manage devices</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" class="close-button" aria-label="Close">
        <span class="close-x">×</span>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <mat-tab-group #tabGroup class="project-tabs">
        
        <!-- Tab 1: Project Information -->
        <mat-tab label="Project Details">
          <div class="tab-content">
            <form [formGroup]="projectForm" class="project-form">
              <div class="form-section">
                <h3 class="section-title">Basic Information</h3>
                
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

                <div class="form-field">
                  <label class="field-label">Status</label>
                  <select class="form-input" formControlName="status">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">Client & Timeline</h3>
                
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
                                     (optionSelected)="onClientSelected($event)">
                      <mat-option *ngFor="let client of filteredClients | async" [value]="client">
                        {{client.name}} - {{client.email}}
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
              </div>
            </form>
          </div>
        </mat-tab>

        <!-- Tab 2: Device Management -->
        <mat-tab label="Device Management">
          <div class="tab-content">
            <div class="devices-section">
              <div class="section-header">
                <h3 class="section-title">Project Devices</h3>
              </div>

              <div class="device-manager-container">
                <app-project-device-manager
                  *ngIf="project"
                  [projectId]="project.id">
                </app-project-device-manager>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 3: Project Summary -->
        <mat-tab label="Summary">
          <div class="tab-content">
            <div class="summary-sections">
              <mat-card class="summary-card">
                <mat-card-header>
                  <mat-card-title>Project Overview</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="summary-row">
                    <span class="summary-label">Name:</span>
                    <span class="summary-value">{{projectForm.get('name')?.value}}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Status:</span>
                    <span class="summary-value status-{{projectForm.get('status')?.value}}">
                      {{projectForm.get('status')?.value | titlecase}}
                    </span>
                  </div>
                  <div class="summary-row" *ngIf="selectedClient">
                    <span class="summary-label">Client:</span>
                    <span class="summary-value">{{selectedClient.name}}</span>
                  </div>
                  <div class="summary-row" *ngIf="projectForm.get('start_date')?.value">
                    <span class="summary-label">Start Date:</span>
                    <span class="summary-value">{{projectForm.get('start_date')?.value}}</span>
                  </div>
                  <div class="summary-row" *ngIf="projectForm.get('end_date')?.value">
                    <span class="summary-label">End Date:</span>
                    <span class="summary-value">{{projectForm.get('end_date')?.value}}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Total Cost:</span>
                    <span class="summary-value cost">{{ project.total_cost | appCurrency }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="summary-card" *ngIf="project">
                <mat-card-header>
                  <mat-card-title>Project Statistics</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-value">{{project.locations?.length || 0}}</div>
                      <div class="stat-label">Locations</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{getTotalDeviceCount()}}</div>
                      <div class="stat-label">Devices</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{project.tasks?.length || 0}}</div>
                      <div class="stat-label">Tasks</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
        Cancel
      </button>
      <button mat-flat-button 
              [disabled]="projectForm.invalid || isLoading"
              (click)="onSave()" 
              class="save-btn">
        <mat-icon *ngIf="isLoading" class="loading-icon">refresh</mat-icon>
        {{isLoading ? 'Updating...' : 'Update Project'}}
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

    .project-tabs {
      width: 100%;
      min-width: 700px;
    }

    .tab-content {
      padding: 32px;
      min-height: 500px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 20px 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .field-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      color: var(--text-primary);
      background-color: var(--surface-color);
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .form-input:focus {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
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

    .client-field-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .client-field {
      flex: 1;
    }

    .add-client-btn {
      margin-top: 24px;
      border-radius: 20px;
      padding: 8px 20px;
      height: 44px;
      flex-shrink: 0;
    }

    .selected-client {
      margin-top: 12px;
    }

    .client-card {
      background: var(--surface-color);
      border: 1px solid #3498db;
      border-radius: 12px;
    }

    .client-card mat-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .client-info h5 {
      margin: 0 0 4px 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .client-info p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .devices-section {
      width: 100%;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .device-manager-container {
      width: 100%;
    }

    .summary-sections {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .summary-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      background-color: var(--surface-color);
    }

    .summary-card mat-card-header {
      background: var(--background-color);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .summary-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .summary-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .summary-value.cost {
      color: #20bf6b;
      font-size: 16px;
    }

    .status-draft { color: #6c757d; }
    .status-active { color: #20bf6b; }
    .status-completed { color: #3498db; }
    .status-cancelled { color: #e74c3c; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
    }

    .stat-item {
      padding: 16px;
      background: var(--background-color);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #3498db;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: 4px;
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px 32px 32px;
      margin: 0 -24px -24px;
      background: var(--background-color);
      border-top: 1px solid var(--border-color);
      gap: 16px;
    }

    .cancel-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      border: 2px solid var(--border-color);
      color: var(--text-secondary);
      background: var(--surface-color);
      min-width: 120px;
      font-size: 16px;
    }

    .save-btn {
      padding: 12px 32px;
      height: auto;
      min-height: 48px;
      border-radius: 24px;
      font-weight: 500;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
      transition: all 0.3s ease;
      min-width: 160px;
      font-size: 16px;
    }

    .save-btn:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
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

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .project-tabs {
        min-width: auto;
      }

      .tab-content {
        padding: 20px 16px;
      }

      .form-row {
        flex-direction: column;
        gap: 16px;
      }

      .client-field-row {
        flex-direction: column;
        gap: 12px;
      }

      .add-client-btn {
        margin-top: 0;
        width: 100%;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .dialog-actions {
        flex-direction: column;
        gap: 12px;
      }

      .cancel-btn, .save-btn {
        width: 100%;
      }
    }

    /* Dark Theme Support */
    :host-context(.dark-theme) {
      .section-title {
        color: var(--text-primary) !important;
      }

      .tab-content {
        background: var(--background-color);
      }

      h3, h4, h5 {
        color: var(--text-primary) !important;
      }
    }
  `]
})
export class EditProjectDialogComponent implements OnInit {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  
  projectForm: FormGroup;
  isLoading = false;
  clients: Client[] = [];
  salespeople: User[] = [];
  selectedClient: Client | null = null;
  currentUser: User | null = null;
  filteredClients: Observable<Client[]> = new Observable();
  project: Project;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditProjectDialogComponent>,
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project }
  ) {
    this.project = data.project;
    this.currentUser = this.authService.getCurrentUser();
    
    // Initialize form with existing project data
    this.projectForm = this.fb.group({
      name: [this.project.name, [Validators.required, Validators.minLength(3)]],
      description: [this.project.description, [Validators.required, Validators.minLength(10)]],
      status: [this.project.status || 'draft'],
      clientSearch: [''],
      start_date: [this.project.start_date ? this.formatDateForInput(this.project.start_date) : ''],
      end_date: [this.project.end_date ? this.formatDateForInput(this.project.end_date) : ''],
      salesperson_id: [this.project.salesperson_id || '']
    });

    // Set selected client if exists
    if (this.project.client) {
      this.selectedClient = this.project.client;
      this.projectForm.get('clientSearch')?.setValue(this.project.client);
    }
  }

  ngOnInit(): void {
    this.loadClients();
    if (this.currentUser?.role === 'admin') {
      this.loadSalespeople();
    }
    this.setupClientAutocomplete();
  }

  private formatDateForInput(dateString: string): string {
    // Convert date string to YYYY-MM-DD format for input[type="date"]
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  private loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
      }
    });
  }

  private loadSalespeople(): void {
    this.apiService.get<User[]>('/users?role=salesperson').subscribe({
      next: (users) => {
        this.salespeople = users;
      },
      error: (error) => {
        console.error('Failed to load salespeople:', error);
      }
    });
  }

  private setupClientAutocomplete(): void {
    this.filteredClients = this.projectForm.get('clientSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchValue = typeof value === 'string' ? value : value?.name || '';
        return this._filterClients(searchValue);
      })
    );
  }

  private _filterClients(value: string): Client[] {
    const filterValue = value.toLowerCase();
    return this.clients.filter(client => 
      client.name.toLowerCase().includes(filterValue) ||
      client.email.toLowerCase().includes(filterValue) ||
      (client.company && client.company.toLowerCase().includes(filterValue))
    );
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
        this.clients.push(result);
        this.selectedClient = result;
        this.projectForm.get('clientSearch')?.setValue(result);
        this.snackBar.open('Client added and selected for project', 'Close', { 
          duration: 3000 
        });
      }
    });
  }


  getTotalDeviceCount(): number {
    if (!this.project.locations) return 0;
    return this.project.locations.reduce((total, location) => {
      return total + (location.devices?.reduce((locationTotal, device) => locationTotal + device.quantity, 0) || 0);
    }, 0);
  }

  onSave(): void {
    if (this.projectForm.valid) {
      this.isLoading = true;
      
      const formValue = this.projectForm.value;
      const updateData = {
        name: formValue.name,
        description: formValue.description,
        status: formValue.status,
        client_id: this.selectedClient?.id || null,
        salesperson_id: formValue.salesperson_id || null,
        start_date: formValue.start_date || null,
        end_date: formValue.end_date || null
      };

      this.apiService.put<Project>(`/projects/${this.project.id}`, updateData).subscribe({
        next: (updatedProject) => {
          this.snackBar.open('Project updated successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(updatedProject);
        },
        error: (error) => {
          console.error('Failed to update project:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to update project', 
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
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 5000 });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}