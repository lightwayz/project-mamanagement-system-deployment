import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';

import { BuildSystem, UpdateBuildSystemRequest } from '../../models/build-system.model';
import { Device } from '../../models/device.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-edit-build-system-dialog',
  templateUrl: './edit-build-system-dialog.component.html',
  styleUrls: ['./edit-build-system-dialog.component.scss']
})
export class EditBuildSystemDialogComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Forms
  basicInfoForm!: FormGroup;
  locationsForm!: FormGroup;

  // Data
  buildSystem: BuildSystem;
  devices: Device[] = [];
  filteredDevices: Device[] = [];

  // State
  loading = false;
  loadingDevices = false;
  totalCost = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditBuildSystemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { buildSystem: BuildSystem },
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.buildSystem = data?.buildSystem || {} as BuildSystem;

    // Ensure required properties exist
    if (!this.buildSystem.locations) {
      this.buildSystem.locations = [];
    }
  }

  ngOnInit(): void {
    console.log('🔧 Edit Build System - Initializing with data:', this.buildSystem);
    this.initializeForms();
    this.loadDevices();
    // Wait for devices to load before populating form to ensure device lookup works
    // populateFormData() will be called after devices are loaded
  }

  initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      name: [this.buildSystem.name, [Validators.required, Validators.maxLength(255)]],
      description: [this.buildSystem.description || '', [Validators.maxLength(1000)]],
      is_active: [this.buildSystem.is_active]
    });

    this.locationsForm = this.fb.group({
      locations: this.fb.array([])
    });
  }

  get locationsArray(): FormArray {
    return this.locationsForm.get('locations') as FormArray;
  }

  populateFormData(): void {
    console.log('📝 Populating form with build system data');
    console.log('  Locations:', this.buildSystem.locations);

    // Clear existing locations
    while (this.locationsArray.length !== 0) {
      this.locationsArray.removeAt(0);
    }

    // Add existing locations
    if (this.buildSystem.locations && this.buildSystem.locations.length > 0) {
      console.log(`  Adding ${this.buildSystem.locations.length} existing locations`);
      this.buildSystem.locations.forEach((location, index) => {
        console.log(`  📍 Location ${index + 1}:`, location.name, 'with', location.devices?.length || 0, 'devices');
        this.addExistingLocation(location);
      });
    } else {
      console.log('  ⚠️ No existing locations found, adding empty location');
      // Add at least one empty location
      this.addLocation();
    }

    this.calculateTotalCost();
    console.log('  💰 Total cost calculated:', this.totalCost);
  }

  addExistingLocation(location: any): void {
    const locationGroup = this.fb.group({
      id: [location.id],
      name: [location.name, [Validators.required, Validators.maxLength(255)]],
      description: [location.description || '', [Validators.maxLength(500)]],
      devices: this.fb.array([])
    });

    // Add existing devices - handle both camelCase and snake_case
    if (location.devices && location.devices.length > 0) {
      const devicesArray = locationGroup.get('devices') as FormArray;
      console.log(`    🔧 Adding ${location.devices.length} devices to location "${location.name}"`);

      location.devices.forEach((device: any, index: number) => {
        // Support both camelCase and snake_case from API
        const deviceId = device.deviceId || device.device_id;
        const unitPrice = device.unitPrice || device.unit_price;

        console.log(`      Device ${index + 1}: ID=${deviceId}, Qty=${device.quantity}, Price=${unitPrice}`);

        const deviceGroup = this.fb.group({
          id: [device.id],
          device_id: [deviceId, [Validators.required]],
          quantity: [device.quantity, [Validators.required, Validators.min(1)]],
          unit_price: [unitPrice, [Validators.required, Validators.min(0)]]
        });

        // Watch for changes
        deviceGroup.valueChanges.subscribe(() => {
          this.calculateTotalCost();
        });

        devicesArray.push(deviceGroup);
      });
    }

    // Add sub-locations if they exist
    const subLocs = location.subLocations || location.sub_locations;
    if (subLocs && subLocs.length > 0) {
      console.log(`    📂 Location "${location.name}" has ${subLocs.length} sub-locations`);
      subLocs.forEach((subLocation: any) => {
        this.addExistingLocation(subLocation);
      });
    }

    this.locationsArray.push(locationGroup);
  }

  addLocation(): void {
    const locationGroup = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(500)]],
      devices: this.fb.array([])
    });

    this.locationsArray.push(locationGroup);
  }

  removeLocation(index: number): void {
    if (this.locationsArray.length > 1) {
      this.locationsArray.removeAt(index);
      this.calculateTotalCost();
    }
  }

  getLocationDevicesArray(locationIndex: number): FormArray {
    const locationGroup = this.locationsArray.at(locationIndex) as FormGroup;
    return locationGroup.get('devices') as FormArray;
  }

  addDeviceToLocation(locationIndex: number, device: Device): void {
    const devicesArray = this.getLocationDevicesArray(locationIndex);

    // Check if device already exists in this location
    const existingDevice = devicesArray.controls.find(control =>
      control.get('device_id')?.value === device.id
    );

    if (existingDevice) {
      this.snackBar.open('Device already added to this location', 'Close', { duration: 2000 });
      return;
    }

    const deviceGroup = this.fb.group({
      id: [null],
      device_id: [device.id, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [device.selling_price, [Validators.required, Validators.min(0)]]
    });

    // Watch for changes
    deviceGroup.valueChanges.subscribe(() => {
      this.calculateTotalCost();
    });

    devicesArray.push(deviceGroup);
    this.calculateTotalCost();
  }

  removeDeviceFromLocation(locationIndex: number, deviceIndex: number): void {
    const devicesArray = this.getLocationDevicesArray(locationIndex);
    devicesArray.removeAt(deviceIndex);
    this.calculateTotalCost();
  }

  loadDevices(): void {
    this.loadingDevices = true;
    this.apiService.get<Device[]>('/devices').subscribe({
      next: (devices) => {
        this.devices = devices.filter(device => device.is_active);
        this.filteredDevices = this.devices;
        this.loadingDevices = false;
        console.log('📦 Loaded', this.devices.length, 'devices for equipment selection');

        // Now that devices are loaded, populate form data
        this.populateFormData();
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.snackBar.open('Failed to load devices', 'Close', { duration: 3000 });
        this.loadingDevices = false;
      }
    });
  }

  calculateTotalCost(): void {
    this.totalCost = 0;
    this.locationsArray.controls.forEach(locationControl => {
      const devicesArray = locationControl.get('devices') as FormArray;
      devicesArray.controls.forEach(deviceControl => {
        const quantity = deviceControl.get('quantity')?.value || 0;
        const unitPrice = deviceControl.get('unit_price')?.value || 0;
        this.totalCost += quantity * unitPrice;
      });
    });
  }

  getDeviceById(deviceId: number): Device | undefined {
    return this.devices.find(device => device.id === deviceId);
  }

  getLocationCost(locationIndex: number): number {
    const devicesArray = this.getLocationDevicesArray(locationIndex);
    return devicesArray.controls.reduce((total, deviceControl) => {
      const quantity = deviceControl.get('quantity')?.value || 0;
      const unitPrice = deviceControl.get('unit_price')?.value || 0;
      return total + (quantity * unitPrice);
    }, 0);
  }

  filterDevices(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDevices = this.devices;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredDevices = this.devices.filter(device =>
      device.name.toLowerCase().includes(term) ||
      device.brand.toLowerCase().includes(term) ||
      device.category.toLowerCase().includes(term) ||
      device.model.toLowerCase().includes(term)
    );
  }

  onSubmit(): void {
    if (!this.basicInfoForm.valid || !this.locationsForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Validate that each location has at least one device
    const hasDevicesInAllLocations = this.locationsArray.controls.every(locationControl => {
      const devicesArray = locationControl.get('devices') as FormArray;
      return devicesArray.length > 0;
    });

    if (!hasDevicesInAllLocations) {
      this.snackBar.open('Each location must have at least one device', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    const locations = this.locationsArray.controls.map(locationControl => {
      const location = locationControl.value;
      return {
        id: location.id,
        name: location.name,
        description: location.description,
        devices: location.devices.map((device: any) => ({
          id: device.id,
          device_id: device.device_id,
          quantity: device.quantity,
          unit_price: device.unit_price
        }))
      };
    });

    const request: UpdateBuildSystemRequest = {
      name: this.basicInfoForm.value.name,
      description: this.basicInfoForm.value.description,
      is_active: this.basicInfoForm.value.is_active,
      locations: locations
    };

    this.apiService.put<any>(`/build-systems/${this.buildSystem.id}`, request).subscribe({
      next: (response) => {
        this.snackBar.open('Build system updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(response.build_system);
      },
      error: (error) => {
        console.error('Error updating build system:', error);
        this.snackBar.open('Failed to update build system', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }
}