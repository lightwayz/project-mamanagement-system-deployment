import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  isActive?: boolean;
}

export interface CurrencySettings {
  selectedCurrency: string;
  availableCurrencies: Currency[];
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private currentCurrency = new BehaviorSubject<Currency>(this.getDefaultCurrency());
  private availableCurrencies = new BehaviorSubject<Currency[]>(this.getGlobalCurrencies());
  private settingsLoaded = false;

  constructor(private apiService: ApiService) {
    this.loadCurrencySettings();
  }

  // Get current currency as observable
  getCurrentCurrency(): Observable<Currency> {
    return this.currentCurrency.asObservable();
  }

  // Get current currency value
  getCurrentCurrencyValue(): Currency {
    return this.currentCurrency.value;
  }

  // Get available currencies
  getAvailableCurrencies(): Observable<Currency[]> {
    return this.availableCurrencies.asObservable();
  }

  // Set current currency
  setCurrentCurrency(currencyCode: string): void {
    const currency = this.findCurrencyByCode(currencyCode);
    if (currency) {
      this.currentCurrency.next(currency);
      this.saveCurrencySettings();
    }
  }

  // Format amount with current currency
  formatCurrency(amount: number, currencyCode?: string): string {
    const currency = currencyCode 
      ? this.findCurrencyByCode(currencyCode) 
      : this.currentCurrency.value;
    
    if (!currency) {
      return amount.toFixed(2);
    }

    return this.formatAmount(amount, currency);
  }

  // Format amount with specific currency
  formatAmount(amount: number, currency: Currency): string {
    const formattedAmount = this.formatNumber(amount, currency);
    
    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  }

  // Get currency symbol for current currency
  getCurrentCurrencySymbol(): string {
    return this.currentCurrency.value.symbol;
  }

  // Get currency symbol for specific currency code
  getCurrencySymbol(currencyCode: string): string {
    const currency = this.findCurrencyByCode(currencyCode);
    return currency ? currency.symbol : '$';
  }

  // Add new custom currency
  addCustomCurrency(currency: Currency): void {
    const currencies = this.availableCurrencies.value;
    const existingIndex = currencies.findIndex(c => c.code === currency.code);
    
    if (existingIndex >= 0) {
      currencies[existingIndex] = currency;
    } else {
      currencies.push(currency);
    }
    
    this.availableCurrencies.next([...currencies]);
    this.saveCurrencySettings();
  }

  // Remove custom currency
  removeCustomCurrency(currencyCode: string): void {
    const currencies = this.availableCurrencies.value.filter(c => c.code !== currencyCode);
    this.availableCurrencies.next(currencies);
    
    // If removed currency was current, switch to USD
    if (this.currentCurrency.value.code === currencyCode) {
      this.setCurrentCurrency('USD');
    }
    
    this.saveCurrencySettings();
  }

  // Parse currency input (remove formatting)
  parseCurrencyInput(input: string): number {
    if (!input) return 0;
    
    const currency = this.currentCurrency.value;
    let cleaned = input.toString();
    
    // Remove currency symbol
    cleaned = cleaned.replace(currency.symbol, '');
    
    // Remove thousands separators
    cleaned = cleaned.replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '');
    
    // Replace decimal separator with standard dot
    if (currency.decimalSeparator !== '.') {
      cleaned = cleaned.replace(currency.decimalSeparator, '.');
    }
    
    // Remove any remaining non-numeric characters except dot and minus
    cleaned = cleaned.replace(/[^\d.-]/g, '');
    
    return parseFloat(cleaned) || 0;
  }

  private formatNumber(amount: number, currency: Currency): string {
    const fixedAmount = amount.toFixed(currency.decimalPlaces);
    const [integer, decimal] = fixedAmount.split('.');
    
    // Add thousands separators
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
    
    if (currency.decimalPlaces > 0 && decimal) {
      return `${formattedInteger}${currency.decimalSeparator}${decimal}`;
    }
    
    return formattedInteger;
  }

  private findCurrencyByCode(code: string): Currency | undefined {
    return this.availableCurrencies.value.find(c => c.code === code);
  }

  private loadCurrencySettings(): void {
    // Try to load from API first
    this.apiService.get<any>('/settings').subscribe({
      next: (settings) => {
        if (settings.currency) {
          this.setCurrentCurrency(settings.currency);
        }
        this.settingsLoaded = true;
      },
      error: (error) => {
        console.warn('Could not load currency settings from API, using defaults');
        this.loadLocalSettings();
        this.settingsLoaded = true;
      }
    });
  }

  private loadLocalSettings(): void {
    try {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        const settings: CurrencySettings = JSON.parse(savedSettings);
        
        if (settings.availableCurrencies) {
          this.availableCurrencies.next(settings.availableCurrencies);
        }
        
        if (settings.selectedCurrency) {
          this.setCurrentCurrency(settings.selectedCurrency);
        }
      }
    } catch (error) {
      console.warn('Failed to load currency settings from localStorage');
    }
  }

  private saveCurrencySettings(): void {
    if (!this.settingsLoaded) return;
    
    try {
      const settings: CurrencySettings = {
        selectedCurrency: this.currentCurrency.value.code,
        availableCurrencies: this.availableCurrencies.value
      };
      
      localStorage.setItem('currencySettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save currency settings to localStorage');
    }
  }

  private getDefaultCurrency(): Currency {
    return {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      symbolPosition: 'before',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      isActive: true
    };
  }

  private getGlobalCurrencies(): Currency[] {
    return [
      // Major Currencies
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        isActive: true
      },
      {
        code: 'GBP',
        name: 'British Pound Sterling',
        symbol: '£',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'NGN',
        name: 'Nigerian Naira',
        symbol: '₦',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      
      // African Currencies
      {
        code: 'ZAR',
        name: 'South African Rand',
        symbol: 'R',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'EGP',
        name: 'Egyptian Pound',
        symbol: 'E£',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'GHS',
        name: 'Ghanaian Cedi',
        symbol: 'GH₵',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'KES',
        name: 'Kenyan Shilling',
        symbol: 'KSh',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      
      // Asian Currencies
      {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        symbolPosition: 'before',
        decimalPlaces: 0,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'CNY',
        name: 'Chinese Yuan',
        symbol: '¥',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      
      // American Currencies
      {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'MXN',
        name: 'Mexican Peso',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'BRL',
        name: 'Brazilian Real',
        symbol: 'R$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        isActive: true
      },
      
      // Middle East Currencies
      {
        code: 'AED',
        name: 'UAE Dirham',
        symbol: 'د.إ',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'SAR',
        name: 'Saudi Riyal',
        symbol: 'ر.س',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      
      // Oceania
      {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'NZD',
        name: 'New Zealand Dollar',
        symbol: 'NZ$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isActive: true
      },
      
      // European Currencies
      {
        code: 'CHF',
        name: 'Swiss Franc',
        symbol: 'CHF',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: "'",
        decimalSeparator: '.',
        isActive: true
      },
      {
        code: 'NOK',
        name: 'Norwegian Krone',
        symbol: 'kr',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        decimalSeparator: ',',
        isActive: true
      },
      {
        code: 'SEK',
        name: 'Swedish Krona',
        symbol: 'kr',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        decimalSeparator: ',',
        isActive: true
      },
      {
        code: 'DKK',
        name: 'Danish Krone',
        symbol: 'kr.',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        isActive: true
      }
    ];
  }
}