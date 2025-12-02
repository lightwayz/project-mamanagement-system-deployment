import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  CreateBuildSystemRequest,
  CreateBuildSystemLocationRequest,
  CreateBuildSystemDeviceRequest,
  BuildSystemLocationStep,
  BuildSystemDeviceSelectionItem
} from '../../models/build-system.model';
import { Device } from '../../models/device.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-add-build-system-dialog',
  templateUrl: './add-build-system-dialog.component.html',
  styleUrls: ['./add-build-system-dialog.component.scss']
})
export class AddBuildSystemDialogComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Forms
  basicInfoForm!: FormGroup;
  locationsForm!: FormGroup;

  // Data
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  locationSteps: BuildSystemLocationStep[] = [];

  // State
  loading = false;
  loadingDevices = false;
  currentLocationIndex = 0;
  currentSubLocationIndex?: number;
  totalCost = 0;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddBuildSystemDialogComponent>,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadDevices();
    this.addInitialLocation();
    this.filteredDevices = this.devices;
  }

  initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1000)]]
    });

    this.locationsForm = this.fb.group({
      locations: this.fb.array([])
    });
  }

  get locationsArray(): FormArray {
    return this.locationsForm.get('locations') as FormArray;
  }

  addInitialLocation(): void {
    this.addLocation('', '');
  }

  addLocation(name: string = '', description: string = ''): void {
    const locationGroup = this.fb.group({
      name: [name, [Validators.required, Validators.maxLength(255)]],
      description: [description, [Validators.maxLength(500)]],
      devices: this.fb.array([])
    });

    this.locationsArray.push(locationGroup);

    // Add to location steps for device selection
    this.locationSteps.push({
      name: name || `Location ${this.locationSteps.length + 1}`,
      description: description,
      level: 0,
      devices: [],
      subLocations: [],
      isExpanded: true
    });
  }

  addSubLocation(parentIndex: number, name: string = '', description: string = ''): void {
    const parentLocation = this.locationSteps[parentIndex];
    if (!parentLocation.subLocations) {
      parentLocation.subLocations = [];
    }

    const subLocationName = name || `${parentLocation.name} - Sub Area ${parentLocation.subLocations.length + 1}`;

    const newSubLocation: BuildSystemLocationStep = {
      name: subLocationName,
      description: description,
      level: 1,
      parent_location_id: parentIndex + 1, // Temporary ID for UI purposes
      devices: [],
      subLocations: [],
      isExpanded: true
    };

    parentLocation.subLocations.push(newSubLocation);
    parentLocation.isExpanded = true; // Ensure parent is expanded when sub-location is added
  }

  removeSubLocation(parentIndex: number, subLocationIndex: number): void {
    const parentLocation = this.locationSteps[parentIndex];
    if (parentLocation.subLocations && parentLocation.subLocations[subLocationIndex]) {
      // Move devices from sub-location back to parent
      const subLocation = parentLocation.subLocations[subLocationIndex];
      subLocation.devices.forEach(device => {
        device.assignedLocation = parentLocation.name;
        parentLocation.devices.push(device);
      });

      parentLocation.subLocations.splice(subLocationIndex, 1);
      this.calculateTotalCost();
    }
  }

  toggleLocationExpansion(locationIndex: number): void {
    this.locationSteps[locationIndex].isExpanded = !this.locationSteps[locationIndex].isExpanded;
  }

  removeLocation(index: number): void {
    if (this.locationsArray.length > 1) {
      this.locationsArray.removeAt(index);
      this.locationSteps.splice(index, 1);
      this.calculateTotalCost();
    }
  }

  getLocationDevicesArray(locationIndex: number): FormArray {
    const locationGroup = this.locationsArray.at(locationIndex) as FormGroup;
    return locationGroup.get('devices') as FormArray;
  }

  loadDevices(): void {
    this.loadingDevices = true;
    this.apiService.get<Device[]>('/devices').subscribe({
      next: (devices) => {
        this.devices = devices.filter(device => device.is_active);
        this.filteredDevices = this.devices;
        this.loadingDevices = false;
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.snackBar.open('Failed to load devices', 'Close', { duration: 3000 });
        this.loadingDevices = false;
      }
    });
  }

  onDeviceSelect(device: Device, locationIndex?: number, subLocationIndex?: number): void {
    // Use current selection if not provided
    const targetLocationIndex = locationIndex !== undefined ? locationIndex : this.currentLocationIndex;
    const targetSubLocationIndex = subLocationIndex !== undefined ? subLocationIndex : this.currentSubLocationIndex;

    let targetLocation: BuildSystemLocationStep;
    let locationName: string;

    if (targetSubLocationIndex !== undefined) {
      // Adding to sub-location
      targetLocation = this.locationSteps[targetLocationIndex].subLocations![targetSubLocationIndex];
      locationName = targetLocation.name;
    } else {
      // Adding to main location
      targetLocation = this.locationSteps[targetLocationIndex];
      locationName = targetLocation.name;
    }

    const existingDevice = targetLocation.devices.find(d => d.id === device.id);

    if (existingDevice) {
      this.snackBar.open('Device already added to this location', 'Close', { duration: 2000 });
      return;
    }

    const deviceSelection: BuildSystemDeviceSelectionItem = {
      ...device,
      selected: true,
      quantity: 1, // Use consistent property name
      unit_price: device.selling_price, // Use consistent property name
      selectedQuantity: 1, // Keep for backward compatibility
      selectedPrice: device.selling_price, // Keep for backward compatibility
      assignedLocation: locationName
    };

    targetLocation.devices.push(deviceSelection);
    this.addDeviceToForm(deviceSelection, targetLocationIndex);
    this.calculateTotalCost();

    // Trigger immediate change detection for real-time UI updates
    this.cdr.detectChanges();
  }

  addDeviceToForm(device: BuildSystemDeviceSelectionItem, locationIndex: number): void {
    const deviceGroup = this.fb.group({
      device_id: [device.id, [Validators.required]],
      quantity: [device.selectedQuantity, [Validators.required, Validators.min(1)]],
      unit_price: [device.selectedPrice, [Validators.required, Validators.min(0)]]
    });

    // Watch for changes to recalculate cost
    deviceGroup.valueChanges.subscribe(() => {
      this.updateDeviceInLocationStep(device.id, locationIndex, deviceGroup.value);
      this.calculateTotalCost();
    });

    const devicesArray = this.getLocationDevicesArray(locationIndex);
    devicesArray.push(deviceGroup);
  }

  updateDeviceInLocationStep(deviceId: number, locationIndex: number, formValue: any): void {
    const locationStep = this.locationSteps[locationIndex];
    const device = locationStep.devices.find(d => d.id === deviceId);
    if (device) {
      // Update both property sets for consistency
      device.quantity = formValue.quantity;
      device.unit_price = formValue.unit_price;
      device.selectedQuantity = formValue.quantity; // Keep for backward compatibility
      device.selectedPrice = formValue.unit_price; // Keep for backward compatibility
    }
  }

  removeDeviceFromLocation(deviceId: number, locationIndex: number, deviceFormIndex: number): void {
    // Remove from location step
    const locationStep = this.locationSteps[locationIndex];
    const deviceIndex = locationStep.devices.findIndex(d => d.id === deviceId);
    if (deviceIndex > -1) {
      locationStep.devices.splice(deviceIndex, 1);
    }

    // Remove from form
    const devicesArray = this.getLocationDevicesArray(locationIndex);
    devicesArray.removeAt(deviceFormIndex);

    this.calculateTotalCost();

    // Trigger immediate change detection for real-time UI updates
    this.cdr.detectChanges();
  }

  calculateTotalCost(): void {
    console.log('🧮 calculateTotalCost() called');
    console.log('📍 locationSteps:', this.locationSteps);

    this.totalCost = this.locationSteps.reduce((total, location, locationIndex) => {
      console.log(`\n📍 Processing location ${locationIndex}: "${location.name}"`);

      // Add cost from main location devices
      let locationTotal = location.devices.reduce((deviceTotal, device, deviceIndex) => {
        // Use consistent property names with fallback for backward compatibility
        const quantity = device.quantity || device.selectedQuantity || 0;
        const price = device.unit_price || device.selectedPrice || 0;
        const deviceCost = quantity * price;
        console.log(`  🔧 Main device ${deviceIndex}: qty=${quantity}, price=${price}, cost=${deviceCost}`);
        return deviceTotal + deviceCost;
      }, 0);

      console.log(`  💰 Main location "${location.name}" devices total: ${locationTotal}`);

      // Add cost from sub-location devices
      if (location.subLocations && location.subLocations.length > 0) {
        console.log(`  📂 Processing ${location.subLocations.length} sub-locations`);

        const subLocationsCost = location.subLocations.reduce((subTotal, subLocation, subIndex) => {
          console.log(`    📂 Sub-location ${subIndex}: "${subLocation.name}"`);

          const subLocationDevicesCost = subLocation.devices.reduce((subDeviceTotal, device, deviceIndex) => {
            // Use consistent property names with fallback for backward compatibility
            const quantity = device.quantity || device.selectedQuantity || 0;
            const price = device.unit_price || device.selectedPrice || 0;
            const deviceCost = quantity * price;
            console.log(`      🔧 Sub device ${deviceIndex}: qty=${quantity}, price=${price}, cost=${deviceCost}`);
            return subDeviceTotal + deviceCost;
          }, 0);

          console.log(`    💰 Sub-location "${subLocation.name}" total: ${subLocationDevicesCost}`);
          return subTotal + subLocationDevicesCost;
        }, 0);

        locationTotal += subLocationsCost;
        console.log(`  💰 Total with sub-locations for "${location.name}": ${locationTotal}`);
      }

      console.log(`💰 Running total after "${location.name}": ${total + locationTotal}`);
      return total + locationTotal;
    }, 0);

    console.log('💰 FINAL TOTAL COST:', this.totalCost);

    // Validation check - compare with manual calculation
    let manualTotal = 0;
    this.locationSteps.forEach((location, i) => {
      const locationCost = this.getLocationTotalCost(i);
      console.log(`✅ Validation - Location ${i} "${location.name}" cost: ${locationCost}`);
      manualTotal += locationCost;
    });
    console.log('✅ Manual calculation total:', manualTotal);

    if (this.totalCost !== manualTotal) {
      console.error('❌ COST MISMATCH! calculateTotalCost():', this.totalCost, 'vs manual:', manualTotal);
    } else {
      console.log('✅ Cost calculations match!');
    }
  }

  getLocationTotalCost(locationIndex: number): number {
    const location = this.locationSteps[locationIndex];

    // Calculate cost from main location devices
    let total = location.devices.reduce((deviceTotal, device) => {
      return deviceTotal + ((device.selectedQuantity || 0) * (device.selectedPrice || 0));
    }, 0);

    // Add cost from sub-location devices
    if (location.subLocations) {
      total += location.subLocations.reduce((subTotal, subLocation) => {
        return subTotal + subLocation.devices.reduce((subDeviceTotal, device) => {
          return subDeviceTotal + ((device.selectedQuantity || 0) * (device.selectedPrice || 0));
        }, 0);
      }, 0);
    }

    return total;
  }

  getSubLocationTotalCost(locationIndex: number, subLocationIndex: number): number {
    const subLocation = this.locationSteps[locationIndex].subLocations?.[subLocationIndex];
    if (!subLocation) return 0;

    return subLocation.devices.reduce((total, device) => {
      return total + ((device.selectedQuantity || 0) * (device.selectedPrice || 0));
    }, 0);
  }

  getLocationDeviceCount(locationIndex: number): number {
    const location = this.locationSteps[locationIndex];

    // Count devices in main location
    let total = location.devices.reduce((deviceTotal, device) => {
      return deviceTotal + (device.selectedQuantity || 0);
    }, 0);

    // Count devices in sub-locations
    if (location.subLocations) {
      total += location.subLocations.reduce((subTotal, subLocation) => {
        return subTotal + subLocation.devices.reduce((subDeviceTotal, device) => {
          return subDeviceTotal + (device.selectedQuantity || 0);
        }, 0);
      }, 0);
    }

    return total;
  }

  getSubLocationDeviceCount(locationIndex: number, subLocationIndex: number): number {
    const subLocation = this.locationSteps[locationIndex].subLocations?.[subLocationIndex];
    if (!subLocation) return 0;

    return subLocation.devices.reduce((total, device) => {
      return total + (device.selectedQuantity || 0);
    }, 0);
  }

  onLocationNameChange(locationIndex: number, target: any): void {
    const newName = (target as HTMLInputElement).value;
    this.locationSteps[locationIndex].name = newName;

    // Update the form control to keep it in sync
    if (this.locationsArray.at(locationIndex)) {
      this.locationsArray.at(locationIndex).get('name')?.setValue(newName);
    }

    // Update assigned location for devices
    this.locationSteps[locationIndex].devices.forEach(device => {
      device.assignedLocation = newName;
    });
  }

  canProceedToDevices(): boolean {
    // Check basic info form is valid
    if (!this.basicInfoForm.valid) {
      return false;
    }

    // Check that we have at least one location
    if (!this.locationSteps || this.locationSteps.length === 0) {
      return false;
    }

    // Check that all locations have valid names
    return this.locationSteps.every(location => {
      // Location must have a non-empty name
      if (!location.name || location.name.trim() === '') {
        return false;
      }

      // If location has sub-locations, they must also have valid names
      if (location.subLocations && location.subLocations.length > 0) {
        return location.subLocations.every(subLocation =>
          subLocation.name && subLocation.name.trim() !== ''
        );
      }

      return true;
    });
  }

  canProceedToReview(): boolean {
    // Device assignment is optional - users can proceed to review without devices
    // They can always add devices later or create empty build system templates
    return true;
  }

  onSubmit(): void {
    if (!this.basicInfoForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Locations form validation removed since we use direct array binding
    // Device assignment is optional - no need to validate device presence

    this.loading = true;

    const locations: CreateBuildSystemLocationRequest[] = this.locationSteps.map((locationStep, index) => {
      // Get form data for main location (fallback to locationStep data if form unavailable)
      const locationForm = this.locationsArray.at(index)?.value;
      const locationName = locationForm?.name || locationStep.name;
      const locationDescription = locationForm?.description || locationStep.description;

      // Map main location devices
      const mainLocationDevices = locationStep.devices.map(device => ({
        device_id: device.id,
        quantity: device.selectedQuantity || 1,
        unit_price: device.selectedPrice || device.selling_price
      }));

      // Map sub-locations and their devices
      const subLocations: CreateBuildSystemLocationRequest[] = [];
      if (locationStep.subLocations && locationStep.subLocations.length > 0) {
        locationStep.subLocations.forEach(subLocation => {
          const subLocationDevices = subLocation.devices.map(device => ({
            device_id: device.id,
            quantity: device.selectedQuantity || 1,
            unit_price: device.selectedPrice || device.selling_price
          }));

          subLocations.push({
            name: subLocation.name,
            description: subLocation.description,
            level: 1,
            devices: subLocationDevices
          });
        });
      }

      return {
        name: locationName,
        description: locationDescription,
        level: 0,
        devices: mainLocationDevices,
        subLocations: subLocations
      };
    });

    const request: CreateBuildSystemRequest = {
      name: this.basicInfoForm.value.name,
      description: this.basicInfoForm.value.description,
      locations: locations
    };

    this.apiService.post<any>('/build-systems', request).subscribe({
      next: (response) => {
        this.snackBar.open('Build system created successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(response.build_system);
      },
      error: (error) => {
        console.error('Error creating build system:', error);
        this.snackBar.open('Failed to create build system', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Device search and filtering
  filterDevices(searchTerm: string): Device[] {
    if (!searchTerm) return this.devices;

    const term = searchTerm.toLowerCase();
    return this.devices.filter(device =>
      device.name.toLowerCase().includes(term) ||
      device.brand.toLowerCase().includes(term) ||
      device.category.toLowerCase().includes(term) ||
      device.model.toLowerCase().includes(term)
    );
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  trackByDeviceId(index: number, device: Device): number {
    return device.id;
  }

  trackByLocationIndex(index: number): number {
    return index;
  }

  // Template methods
  onDeviceSearch(searchTerm: string): void {
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

  isDeviceSelected(device: Device): boolean {
    return this.locationSteps.some(location =>
      location.devices.some(d => d.id === device.id)
    );
  }

  getTotalDeviceCount(): number {
    return this.locationSteps.reduce((total, location) => {
      // Count devices in main location
      let locationTotal = location.devices.reduce((deviceTotal, device) => {
        return deviceTotal + (device.selectedQuantity || 0);
      }, 0);

      // Count devices in sub-locations
      if (location.subLocations) {
        locationTotal += location.subLocations.reduce((subTotal, subLocation) => {
          return subTotal + subLocation.devices.reduce((subDeviceTotal, device) => {
            return subDeviceTotal + (device.selectedQuantity || 0);
          }, 0);
        }, 0);
      }

      return total + locationTotal;
    }, 0);
  }

  updateDeviceQuantity(locationIndex: number, deviceIndex: number, newQuantity: number): void {
    if (newQuantity < 1) return;

    const device = this.locationSteps[locationIndex].devices[deviceIndex];
    if (device) {
      // Update both property sets for consistency
      device.quantity = newQuantity;
      device.selectedQuantity = newQuantity; // Keep for backward compatibility
      this.calculateTotalCost();

      // Trigger immediate change detection for real-time UI updates
      this.cdr.detectChanges();
    }
  }

  updateDevicePrice(locationIndex: number, deviceIndex: number, event: any): void {
    const newPrice = parseFloat(event.target.value);
    if (isNaN(newPrice) || newPrice < 0) return;

    const device = this.locationSteps[locationIndex].devices[deviceIndex];
    if (device) {
      // Update both property sets for consistency
      device.unit_price = newPrice;
      device.selectedPrice = newPrice; // Keep for backward compatibility
      this.calculateTotalCost();

      // Trigger immediate change detection for real-time UI updates
      this.cdr.detectChanges();
    }
  }

  onLocationDescriptionChange(index: number, target: any): void {
    const value = (target as HTMLInputElement).value;
    if (this.locationSteps[index]) {
      this.locationSteps[index].description = value;

      // Update the form control to keep it in sync
      if (this.locationsArray.at(index)) {
        this.locationsArray.at(index).get('description')?.setValue(value);
      }
    }
  }

  onSubLocationNameChange(locationIndex: number, subLocationIndex: number, target: any): void {
    const newName = (target as HTMLInputElement).value;
    const subLocation = this.locationSteps[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation) {
      subLocation.name = newName;
      // Update device assignments to new sub-location name
      subLocation.devices.forEach(device => {
        device.assignedLocation = newName;
      });
    }
  }

  onSubLocationDescriptionChange(locationIndex: number, subLocationIndex: number, target: any): void {
    const value = (target as HTMLInputElement).value;
    const subLocation = this.locationSteps[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation) {
      subLocation.description = value;
    }
  }

  goToStep(stepIndex: number): void {
    console.log(`🎯 Navigating to step ${stepIndex}`);
    this.stepper.selectedIndex = stepIndex;

    // If navigating to review step (step 3), ensure cost is calculated
    if (stepIndex === 3) {
      console.log('📊 Entering review step - triggering cost calculation');
      this.calculateTotalCost();
    }
  }

  onStepChange(event: any): void {
    const stepIndex = event.selectedIndex;
    console.log(`🔄 Step changed to ${stepIndex}`);

    // Always recalculate costs when step changes, especially for review step
    if (stepIndex === 3) {
      console.log('📊 Entered review step via stepper - recalculating costs');
      setTimeout(() => {
        this.calculateTotalCost();
      }, 100); // Small delay to ensure data is fully loaded
    }
  }

  selectLocation(locationIndex: number): void {
    this.currentLocationIndex = locationIndex;
    this.currentSubLocationIndex = undefined;
  }

  selectSubLocation(locationIndex: number, subLocationIndex: number): void {
    this.currentLocationIndex = locationIndex;
    this.currentSubLocationIndex = subLocationIndex;
  }

  isLocationSelected(locationIndex: number): boolean {
    return this.currentLocationIndex === locationIndex && this.currentSubLocationIndex === undefined;
  }

  isSubLocationSelected(locationIndex: number, subLocationIndex: number): boolean {
    return this.currentLocationIndex === locationIndex && this.currentSubLocationIndex === subLocationIndex;
  }

  removeDeviceFromSubLocation(deviceId: number, locationIndex: number, subLocationIndex: number): void {
    const subLocation = this.locationSteps[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation) {
      const deviceIndex = subLocation.devices.findIndex(d => d.id === deviceId);
      if (deviceIndex > -1) {
        subLocation.devices.splice(deviceIndex, 1);
        this.calculateTotalCost();
      }
    }
  }

  updateSubLocationDeviceQuantity(locationIndex: number, subLocationIndex: number, deviceIndex: number, newQuantity: number): void {
    if (newQuantity < 1) return;

    const subLocation = this.locationSteps[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation && subLocation.devices[deviceIndex]) {
      // Update both property sets for consistency
      subLocation.devices[deviceIndex].quantity = newQuantity;
      subLocation.devices[deviceIndex].selectedQuantity = newQuantity; // Keep for backward compatibility
      this.calculateTotalCost();

      // Trigger immediate change detection for real-time UI updates
      this.cdr.detectChanges();
    }
  }

  updateSubLocationDevicePrice(locationIndex: number, subLocationIndex: number, deviceIndex: number, event: any): void {
    const newPrice = parseFloat(event.target.value);
    if (isNaN(newPrice) || newPrice < 0) return;

    const subLocation = this.locationSteps[locationIndex]?.subLocations?.[subLocationIndex];
    if (subLocation && subLocation.devices[deviceIndex]) {
      // Update both property sets for consistency
      subLocation.devices[deviceIndex].unit_price = newPrice;
      subLocation.devices[deviceIndex].selectedPrice = newPrice; // Keep for backward compatibility
      this.calculateTotalCost();

      // Trigger immediate change detection for real-time UI updates
      this.cdr.detectChanges();
    }
  }

  // Helper methods for template device count calculations
  getLocationDevicesCount(location: any): number {
    if (!location || !location.devices) return 0;
    return location.devices.reduce((sum: number, device: any) => sum + (device.selectedQuantity || 0), 0);
  }

  getSubLocationDevicesCount(subLocation: any): number {
    if (!subLocation || !subLocation.devices) return 0;
    return subLocation.devices.reduce((sum: number, device: any) => sum + (device.selectedQuantity || 0), 0);
  }
}
