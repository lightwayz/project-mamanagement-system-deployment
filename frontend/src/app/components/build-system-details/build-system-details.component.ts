import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BuildSystem } from '../../models/build-system.model';

@Component({
  selector: 'app-build-system-details',
  templateUrl: './build-system-details.component.html',
  styleUrls: ['./build-system-details.component.scss']
})
export class BuildSystemDetailsComponent {
  buildSystem: BuildSystem;

  constructor(
    public dialogRef: MatDialogRef<BuildSystemDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { buildSystem: BuildSystem }
  ) {
    this.buildSystem = data?.buildSystem || {} as BuildSystem;

    // Ensure locations array exists
    if (!this.buildSystem.locations) {
      this.buildSystem.locations = [];
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  getTotalDeviceCount(): number {
    return this.buildSystem.locations?.reduce((total, location) => {
      return total + (location.devices?.reduce((locationTotal, device) => {
        return locationTotal + (device.quantity || 0);
      }, 0) || 0);
    }, 0) || 0;
  }

  getLocationCost(location: any): number {
    return location.devices?.reduce((total: number, device: any) => {
      return total + ((device.quantity || 0) * (device.unit_price || 0));
    }, 0) || 0;
  }

  getTotalLocationCost(location: any): number {
    let total = this.getLocationCost(location);

    // Add sub-location costs
    if (location.subLocations) {
      total += location.subLocations.reduce((subTotal: number, subLocation: any) => {
        return subTotal + this.getLocationCost(subLocation);
      }, 0);
    }

    return total;
  }

  /**
   * Calculate actual total cost from device data instead of trusting stored value
   */
  calculateActualTotalCost(): number {
    if (!this.buildSystem?.locations) {
      console.log('🔍 No locations found for cost calculation');
      return 0;
    }

    const calculatedTotal = this.buildSystem.locations.reduce((total: number, location: any) => {
      const locationCost = this.getTotalLocationCost(location);
      console.log(`📍 Location "${location.name}" cost: ${locationCost}`);
      return total + locationCost;
    }, 0);

    const storedTotal = this.buildSystem.total_cost || 0;

    console.log('💰 Cost Comparison:');
    console.log(`  📊 Calculated from devices: ${calculatedTotal}`);
    console.log(`  💾 Stored in database: ${storedTotal}`);

    if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
      console.warn('⚠️ COST MISMATCH DETECTED!');
      console.warn(`  Expected: ${calculatedTotal}`);
      console.warn(`  Stored: ${storedTotal}`);
      console.warn(`  Difference: ${Math.abs(calculatedTotal - storedTotal)}`);
    } else {
      console.log('✅ Costs match perfectly!');
    }

    return calculatedTotal;
  }

  /**
   * Get the display total cost - uses calculated value for accuracy
   */
  getDisplayTotalCost(): number {
    return this.calculateActualTotalCost();
  }

  getTotalLocationDeviceCount(location: any): number {
    let count = location.devices?.reduce((total: number, device: any) => {
      return total + (device.quantity || 0);
    }, 0) || 0;

    // Add sub-location device counts
    if (location.subLocations) {
      count += location.subLocations.reduce((subTotal: number, subLocation: any) => {
        return subTotal + (subLocation.devices?.reduce((deviceTotal: number, device: any) => {
          return deviceTotal + (device.quantity || 0);
        }, 0) || 0);
      }, 0);
    }

    return count;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }
}