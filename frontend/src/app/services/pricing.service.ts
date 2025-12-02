import { Injectable } from '@angular/core';
import { Device } from '../models/device.model';

export interface PricingCalculation {
  costPrice: number;
  retailPrice: number;
  sellingPrice: number;
  markup: number;
  discount: number;
  profit: number;
  isProfitable: boolean;
  calculatedSellingPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {

  /**
   * Calculate pricing details for a device
   * Formula: Selling Price = MSRP * (1 + Markup%) or MSRP * (1 - Discount%)
   * Profit = Selling Price - Cost Price
   */
  calculatePricing(device: Device): PricingCalculation {
    const costPrice = device.cost_price || 0;
    const retailPrice = device.retail_price || 0; // MSRP
    const markup = device.markup || 0;
    const discount = device.discount || 0;
    const sellingPrice = device.selling_price || 0;

    // Calculate selling price based on MSRP and markup/discount
    let calculatedSellingPrice = retailPrice;
    
    if (markup > 0) {
      // Selling Price = MSRP * (1 + Markup%)
      calculatedSellingPrice = retailPrice * (1 + (markup / 100));
    } else if (discount > 0) {
      // Selling Price = MSRP * (1 - Discount%)
      calculatedSellingPrice = retailPrice * (1 - (discount / 100));
    }

    // Calculate profit/loss
    const profit = sellingPrice - costPrice;
    const isProfitable = profit >= 0;

    return {
      costPrice,
      retailPrice,
      sellingPrice,
      markup,
      discount,
      profit,
      isProfitable,
      calculatedSellingPrice: Math.round(calculatedSellingPrice * 100) / 100
    };
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  /**
   * Get profit color class based on value
   */
  getProfitColorClass(profit: number): string {
    return profit >= 0 ? 'profit-positive' : 'profit-negative';
  }
}