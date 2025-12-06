import {
  Component,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';

import { Observable } from 'rxjs';
import {
  startWith,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

import type {
  Project,
  CreateProjectLocationRequest,
  CreateProjectDeviceRequest,
  DeviceSelectionItem
} from '../../models/project.model';
import { Client } from '../../models/client.model';
import { User } from '../../models/user.model';
import { BuildSystem } from '../../models/build-system.model';

import { AddClientDialogComponent } from '../add-client-dialog/add-client-dialog.component';

@Component({
  selector: 'app-add-project-dialog',
  // 🔴 IMPORTANT: not standalone, because we declare it in AppModule
  // standalone: true,
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>assignment</mat-icon>
        </div>
        <div class="header-text">
          <h2>Create New Project</h2>
          <p>Set up a new smart home installation project</p>
        </div>
      </div>
      <button mat-icon-button (click)="onCancel()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="projectForm" class="project-form">
        <!-- BASIC INFO -->
        <h3>Basic Information</h3>

        <div class="form-field">
          <label>Project Name *</label>
          <input class="form-input"
                 type="text"
                 formControlName="name"
                 placeholder="Enter project name" />
        </div>

        <div class="form-field">
          <label>Description *</label>
          <textarea class="form-input"
                    rows="3"
                    formControlName="description"
                    placeholder="Project description and scope"></textarea>
        </div>

        <!-- CLIENT -->
        <h3>Client</h3>
        <div class="client-row">
          <div class="form-field client-field">
            <label>Client</label>
            <input class="form-input"
                   type="text"
                   formControlName="clientSearch"
                   [matAutocomplete]="clientAuto"
                   placeholder="Search or select client" />

            <mat-autocomplete #clientAuto="matAutocomplete"
                              [displayWith]="displayClient.bind(this)"
                              (optionSelected)="onClientSelected($event)">
              <mat-option *ngFor="let client of (filteredClients$ | async) || []"
                          [value]="client">
                {{ client.name }} - {{ client.email }}
              </mat-option>
              <mat-option *ngIf="(filteredClients$ | async)?.length === 0" disabled>
                No clients found
              </mat-option>
            </mat-autocomplete>
          </div>

          <button mat-raised-button color="primary" type="button"
                  (click)="openAddClientDialog()">
            <mat-icon>person_add</mat-icon>
            New Client
          </button>
        </div>

        <div *ngIf="selectedClient" class="selected-client">
          <mat-card>
            <mat-card-content class="selected-client-content">
              <div>
                <div><strong>{{ selectedClient.name }}</strong></div>
                <div>{{ selectedClient.email }} · {{ selectedClient.phone }}</div>
              </div>
              <button mat-icon-button color="warn" type="button"
                      (click)="clearClient()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- DATES & SALESPERSON -->
        <h3>Timeline & Assignment</h3>
        <div class="row">
          <div class="form-field half">
            <label>Start Date</label>
            <input class="form-input" type="date" formControlName="start_date" />
          </div>
          <div class="form-field half">
            <label>End Date</label>
            <input class="form-input" type="date" formControlName="end_date" />
          </div>
        </div>

        <div class="form-field" *ngIf="currentUser?.role === 'admin'">
          <label>Salesperson</label>
          <select class="form-input" formControlName="salesperson_id">
            <option [ngValue]="null">No salesperson assigned</option>
            <option *ngFor="let user of salespeople" [ngValue]="user.id">
              {{ user.name }} - {{ user.email }}
            </option>
          </select>
        </div>

        <!-- LOCATIONS -->
        <h3>Locations</h3>
        <button mat-stroked-button color="primary" type="button"
                (click)="addLocation()">
          <mat-icon>add</mat-icon>
          Add Location
        </button>

        <div class="locations">
          <div *ngFor="let loc of locations; let i = index" class="location-card">
            <div class="location-header">
              <strong>Location {{ i + 1 }}</strong>
              <button mat-icon-button color="warn" type="button"
                      (click)="locations.length > 1 && locations.splice(i, 1)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>

            <div class="form-field">
              <label>Location Name *</label>
              <input class="form-input"
                     [(ngModel)]="loc.name"
                     [ngModelOptions]="{standalone: true}"
                     placeholder="e.g. Living Room" />
            </div>

            <div class="form-field">
              <label>Description</label>
              <input class="form-input"
                     [(ngModel)]="loc.description"
                     [ngModelOptions]="{standalone: true}"
                     placeholder="Optional" />
            </div>

            <div class="sub-locations">
              <div class="sub-header">
                <span>Sub-locations</span>
                <button mat-button type="button"
                        (click)="addSubLocation(i)">
                  <mat-icon>add</mat-icon>
                  Add Sub-location
                </button>
              </div>

              <div *ngFor="let sub of loc.subLocations; let j = index"
                   class="sub-card">
                <div class="form-field">
                  <label>Sub-location Name *</label>
                  <input class="form-input"
                         [(ngModel)]="sub.name"
                         [ngModelOptions]="{standalone: true}"
                         placeholder="e.g. TV Area" />
                </div>
                <div class="form-field">
                  <label>Description</label>
                  <input class="form-input"
                         [(ngModel)]="sub.description"
                         [ngModelOptions]="{standalone: true}"
                         placeholder="Optional" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DEVICE SELECTION (hooked to your existing component) -->
        <h3>Devices</h3>
        <app-device-selector
          [selectedDevices]="selectedDevices"
          [locations]="locations"
          [allowMultipleSelection]="true"
          [showPriceOverride]="true"
          (selectionChanged)="onDeviceSelectionChanged($event)">
        </app-device-selector>

        <div class="total">
          <strong>Total Project Cost:</strong> {{ totalProjectCost | appCurrency }}
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()" [disabled]="isLoading">
        Cancel
      </button>
      <button mat-flat-button color="primary"
              (click)="onSave()"
              [disabled]="isLoading || projectForm.invalid">
        {{ isLoading ? 'Creating...' : 'Create Project' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;
    }
    .header-text h2 {
      margin: 0;
      font-size: 18px;
    }
    .header-text p {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
    .dialog-content {
      padding: 16px 24px;
    }
    .project-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    h3 {
      margin: 16px 0 8px;
      font-size: 16px;
      font-weight: 600;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-input {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #ddd;
      font-size: 14px;
    }
    .row {
      display: flex;
      gap: 12px;
    }
    .half {
      flex: 1;
    }
    .client-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .client-field {
      flex: 1;
    }
    .selected-client {
      margin-top: 8px;
    }
    .selected-client-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .locations {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .location-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
    }
    .location-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .sub-locations {
      margin-top: 8px;
      border-top: 1px dashed #ddd;
      padding-top: 8px;
    }
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .sub-card {
      border-radius: 6px;
      padding: 8px;
      background: #fafafa;
      margin-bottom: 8px;
    }
    .total {
      margin-top: 8px;
      text-align: right;
    }
  `]
})
export class AddProjectDialogComponent implements OnInit {

  @ViewChild('stepper') stepper!: MatStepper;

  projectForm!: FormGroup;
  isLoading = false;
  currentUser!: User | null;

  clients: Client[] = [];
  filteredClients$!: Observable<Client[]>;
  selectedClient: Client | null = null;

  salespeople: User[] = [];

  locations: any[] = [];
  projectLocations: CreateProjectLocationRequest[] = [];
  selectedDevices: DeviceSelectionItem[] = [];
  totalProjectCost = 0;

  availableBuildSystems: BuildSystem[] = [];
  selectedBuildSystem: BuildSystem | null = null;

  deviceStepCompleted = false;
  isDeviceStepOptional = true;

  companyLogoFile: File | null = null;
  clientLogoFile: File | null = null;
  projectImageFile: File | null = null;

  companyLogoPreview: string | null = null;
  clientLogoPreview: string | null = null;
  projectImagePreview: string | null = null;

  constructor(
      private fb: FormBuilder,
      private api: ApiService,
      private auth: AuthService,
      private snack: MatSnackBar,
      private dialog: MatDialog,
      private dialogRef: MatDialogRef<AddProjectDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.auth.getCurrentUser();
  }

  ngOnInit(): void {
    this.buildForm();
    this.initDefaultLocation();
    this.loadClients();
    this.loadBuildSystems();

    if (this.currentUser?.role === 'admin') {
      this.loadSalespeople();
    }

    this.initClientAutocomplete();
  }

  /* ---------- FORM ---------- */

  private buildForm(): void {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      clientSearch: [''],
      start_date: [''],
      end_date: [''],
      salesperson_id: [
        this.currentUser?.role === 'salesperson'
            ? this.currentUser.id
            : null
      ]
    });
  }

  /* ---------- BUILD SYSTEMS ---------- */

  private loadBuildSystems(): void {
    this.api.get<{ data: BuildSystem[] }>('/build-systems').subscribe({
      next: (res) => {
        this.availableBuildSystems = res.data || [];
      },
      error: () => {
        this.snack.open('Failed to load build systems', 'Close', { duration: 3000 });
      }
    });
  }

  /* ---------- CLIENTS ---------- */

  private loadClients(): void {
    this.api.get<{ data: Client[] }>('/clients').subscribe({
      next: res => this.clients = res.data ?? [],
      error: () =>
          this.snack.open('Failed to load clients', 'Close', { duration: 3000 })
    });
  }

  initClientAutocomplete(): void {
    this.filteredClients$ = this.projectForm.get('clientSearch')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        map(value => {
          const search =
              typeof value === 'string'
                  ? value.toLowerCase()
                  : value?.name?.toLowerCase();

          if (!search) {
            return this.clients.slice(0, 20);
          }

          return this.clients
              .filter(c =>
                  c.name?.toLowerCase().includes(search) ||
                  c.email?.toLowerCase().includes(search) ||
                  c.company?.toLowerCase().includes(search)
              )
              .slice(0, 20);
        })
    );
  }

  displayClient(client: Client): string {
    return client ? client.name : '';
  }

  onClientSelected(event: any): void {
    this.selectedClient = event.option.value;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.projectForm.get('clientSearch')!.setValue('');
  }

  openAddClientDialog(): void {
    const ref = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      disableClose: true
    });

    ref.afterClosed().subscribe(client => {
      if (!client) return;
      this.clients.push(client);
      this.selectedClient = client;
      this.projectForm.get('clientSearch')!.setValue(client);
    });
  }

  /* ---------- USERS ---------- */

  private loadSalespeople(): void {
    this.api.get<{ data: User[] }>('/users?role=salesperson').subscribe({
      next: res => this.salespeople = res.data,
      error: () =>
          this.snack.open('Failed to load salespeople', 'Close', { duration: 3000 })
    });
  }

  /* ---------- LOCATIONS ---------- */

  private initDefaultLocation(): void {
    this.locations = [{
      id: this.uid(),
      name: 'Main Location',
      description: '',
      subLocations: [],
      isExpanded: true
    }];
  }

  addLocation(): void {
    this.locations.push({
      id: this.uid(),
      name: '',
      description: '',
      subLocations: [],
      isExpanded: true
    });
  }

  addSubLocation(i: number): void {
    this.locations[i].subLocations.push({
      id: this.uid(),
      name: '',
      description: ''
    });
  }

  /* ---------- DEVICES ---------- */

  onDeviceSelectionChanged(devices: DeviceSelectionItem[]): void {
    this.selectedDevices = devices;
    this.recalculateCost();
  }

  private recalculateCost(): void {
    this.totalProjectCost = this.selectedDevices.reduce(
        (sum, d) =>
            sum + ((d.selectedQuantity || 1) * (d.selectedPrice || d.selling_price)),
        0
    );
  }

  private buildLocationsPayload(): void {
    this.projectLocations = [];

    // locations + sublocations
    this.locations.forEach(loc => {
      if (!loc.name?.trim()) return;

      this.projectLocations.push({
        name: loc.name,
        description: loc.description,
        level: 0,
        devices: []
      });

      loc.subLocations?.forEach((sub: any) => {
        if (!sub.name?.trim()) return;

        this.projectLocations.push({
          name: sub.name,
          description: sub.description,
          level: 1,
          devices: []
        });
      });
    });

    // assign devices to locations
    this.selectedDevices.forEach(device => {
      const locName = device.assignedLocation || this.projectLocations[0]?.name;
      const slot = this.projectLocations.find(l => l.name === locName);
      if (!slot) return;

      // ✅ TS18048 fix
      const devicesArray: CreateProjectDeviceRequest[] =
          slot.devices ?? (slot.devices = []);

      devicesArray.push({
        device_id: device.id,
        quantity: device.selectedQuantity || 1,
        unit_price: device.selectedPrice || device.selling_price
      });
    });
  }

  /* ---------- SAVE ---------- */

  onSave(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.snack.open('Please complete required fields', 'Close', { duration: 3000 });
      return;
    }

    this.buildLocationsPayload();
    this.isLoading = true;

    const f = this.projectForm.value;
    const payload = new FormData();

    payload.append('name', f.name);
    payload.append('description', f.description);

    if (this.selectedClient) {
      payload.append('client_id', String(this.selectedClient.id));
    }
    if (f.salesperson_id) {
      payload.append('salesperson_id', String(f.salesperson_id));
    }
    if (f.start_date) {
      payload.append('start_date', f.start_date);
    }
    if (f.end_date) {
      payload.append('end_date', f.end_date);
    }

    payload.append('locations', JSON.stringify(this.projectLocations));

    if (this.companyLogoFile) payload.append('company_logo', this.companyLogoFile);
    if (this.clientLogoFile) payload.append('client_logo', this.clientLogoFile);
    if (this.projectImageFile) payload.append('project_image', this.projectImageFile);

    this.api.post<Project>('/projects', payload).subscribe({
      next: project => {
        this.snack.open('Project created successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(project);
      },
      error: err => {
        this.isLoading = false;
        this.snack.open(
            err.error?.message || 'Failed to create project',
            'Close',
            { duration: 4000 }
        );
      }
    });
  }

  /* ---------- UTILS ---------- */

  uid(): string {
    return 'loc_' + Math.random().toString(36).substring(2, 10);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
