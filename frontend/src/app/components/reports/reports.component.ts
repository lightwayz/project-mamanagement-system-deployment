import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExportDialogComponent } from '../export-dialog/export-dialog.component';
import { PricingService } from '../../services/pricing.service';
import { CurrencyService } from '../../services/currency.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports',
  template: `
    <div class="reports-container">
      <h2>Reports & Analytics</h2>
      
      <div class="report-cards">
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Project Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="report-stat">
              <h3>Total Projects</h3>
              <p class="stat-value">{{projectStats.total || 0}}</p>
            </div>
            <div class="report-stat">
              <h3>Active Projects</h3>
              <p class="stat-value">{{projectStats.active || 0}}</p>
            </div>
            <div class="report-stat">
              <h3>Completed Projects</h3>
              <p class="stat-value">{{projectStats.completed || 0}}</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Revenue Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="report-stat">
              <h3>This Month</h3>
              <p class="stat-value">{{ revenueStats.monthly || 0 | appCurrency }}</p>
            </div>
            <div class="report-stat">
              <h3>This Year</h3>
              <p class="stat-value">{{ revenueStats.yearly || 0 | appCurrency }}</p>
            </div>
            <div class="report-stat">
              <h3>Total Revenue</h3>
              <p class="stat-value">{{ revenueStats.total || 0 | appCurrency }}</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>Device Analytics</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="report-stat">
              <h3>Total Devices</h3>
              <p class="stat-value">{{deviceStats.total || 0}}</p>
            </div>
            <div class="report-stat">
              <h3>Low Stock Items</h3>
              <p class="stat-value">{{deviceStats.low_stock || 0}}</p>
            </div>
            <div class="report-stat">
              <h3>Categories</h3>
              <p class="stat-value">{{deviceStats.categories || 0}}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <mat-card class="action-card">
        <mat-card-header>
          <mat-card-title>Pricing Calculations</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="pricing-info">
            <div class="formula-section">
              <h4>Calculation Formula:</h4>
              <div class="formula">
                <strong>Selling Price</strong> = MSRP × (1 + Markup%) <em>or</em> MSRP × (1 - Discount%)
              </div>
              <div class="formula">
                <strong>Profit/Loss</strong> = Selling Price - Cost Price
              </div>
              <div class="color-legend">
                <span class="profit-positive">● Positive numbers (Profit)</span>
                <span class="profit-negative">● Negative numbers (Loss)</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="action-card">
        <mat-card-header>
          <mat-card-title>Export Reports</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="export-buttons">
            <button mat-raised-button color="primary" (click)="exportProjectReport()">
              <mat-icon>download</mat-icon>
              Export Project Report
            </button>
            <button mat-raised-button color="accent" (click)="exportRevenueReport()">
              <mat-icon>download</mat-icon>
              Export Revenue Report
            </button>
            <button mat-raised-button (click)="exportDeviceReport()">
              <mat-icon>download</mat-icon>
              Export Device Report
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
    }
    .reports-container h2 {
      color: var(--text-primary) !important;
    }
    .report-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    .report-card {
      height: fit-content;
    }
    .report-stat {
      margin-bottom: 16px;
    }
    .report-stat h3 {
      margin: 0 0 8px 0;
      color: var(--text-secondary) !important;
      font-size: 14px;
      font-weight: 500;
    }
    .stat-value {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: var(--text-primary) !important;
    }
    .action-card {
      margin-top: 24px;
    }
    .export-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .pricing-info {
      padding: 16px 0;
    }
    .formula-section h4 {
      color: var(--text-primary) !important;
      margin: 0 0 16px 0;
      font-weight: 500;
    }
    .formula {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
      color: var(--text-primary) !important;
    }
    .formula strong {
      color: #1976d2;
    }
    .formula em {
      color: var(--text-secondary) !important;
      font-style: italic;
    }
    .color-legend {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .profit-positive {
      color: #4caf50 !important;
      font-weight: 500;
    }
    .profit-negative {
      color: #f44336 !important;
      font-weight: 500;
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  projectStats = {
    total: 0,
    active: 0,
    completed: 0
  };
  
  revenueStats = {
    monthly: 0,
    yearly: 0,
    total: 0
  };
  
  deviceStats = {
    total: 0,
    low_stock: 0,
    categories: 0
  };

  private currencySubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pricingService: PricingService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  ngOnDestroy(): void {
    if (this.currencySubscription) {
      this.currencySubscription.unsubscribe();
    }
  }

  loadReportData(): void {
    // Load project stats
    this.apiService.get('/reports/projects').subscribe({
      next: (data: any) => {
        this.projectStats = data;
      },
      error: (error) => {
        console.error('Failed to load project stats:', error);
      }
    });

    // Load revenue stats
    this.apiService.get('/reports/revenue').subscribe({
      next: (data: any) => {
        this.revenueStats = data;
      },
      error: (error) => {
        console.error('Failed to load revenue stats:', error);
      }
    });

    // Load device stats
    this.apiService.get('/reports/devices').subscribe({
      next: (data: any) => {
        this.deviceStats = data;
      },
      error: (error) => {
        console.error('Failed to load device stats:', error);
      }
    });
  }

  exportProjectReport(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '400px',
      data: {
        title: 'Export Project Report',
        subtitle: 'Choose the format for your project report export.'
      }
    });

    dialogRef.afterClosed().subscribe(format => {
      if (format) {
        this.generateProjectReport(format);
      }
    });
  }

  exportRevenueReport(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '400px',
      data: {
        title: 'Export Revenue Report',
        subtitle: 'Choose the format for your revenue report export.'
      }
    });

    dialogRef.afterClosed().subscribe(format => {
      if (format) {
        this.generateRevenueReport(format);
      }
    });
  }

  exportDeviceReport(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '400px',
      data: {
        title: 'Export Device Report',
        subtitle: 'Choose the format for your device report with pricing calculations.'
      }
    });

    dialogRef.afterClosed().subscribe(format => {
      if (format) {
        this.generateDeviceReport(format);
      }
    });
  }

  private generateProjectReport(format: 'pdf' | 'excel'): void {
    this.snackBar.open('Generating project report...', 'Close', { duration: 2000 });
    
    this.apiService.getBlob(`/reports/projects/export`, { format: format }).subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, `project-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`, format);
      },
      error: (error) => {
        console.error('Failed to generate project report:', error);
        this.snackBar.open('Failed to generate project report', 'Close', { duration: 3000 });
      }
    });
  }

  private generateRevenueReport(format: 'pdf' | 'excel'): void {
    this.snackBar.open('Generating revenue report...', 'Close', { duration: 2000 });
    
    this.apiService.getBlob(`/reports/revenue/export`, { format: format }).subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, `revenue-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`, format);
      },
      error: (error) => {
        console.error('Failed to generate revenue report:', error);
        this.snackBar.open('Failed to generate revenue report', 'Close', { duration: 3000 });
      }
    });
  }

  private generateDeviceReport(format: 'pdf' | 'excel'): void {
    this.snackBar.open('Generating device report with pricing calculations...', 'Close', { duration: 2000 });
    
    // First get devices data to calculate pricing
    this.apiService.get<any[]>('/devices').subscribe({
      next: (devices: any[]) => {
        // Calculate pricing for each device
        const deviceReportData = devices.map(device => {
          const pricing = this.pricingService.calculatePricing(device);
          return {
            ...device,
            calculated_selling_price: pricing.calculatedSellingPrice,
            profit_loss: pricing.profit,
            is_profitable: pricing.isProfitable
          };
        });

        // Send to backend for export
        const exportData = {
          format: format,
          devices: deviceReportData,
          include_pricing: true
        };

        this.apiService.postBlob('/reports/devices/export', exportData).subscribe({
          next: (blob: Blob) => {
            this.downloadFile(blob, `device-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`, format);
          },
          error: (error) => {
            console.error('Failed to generate device report:', error);
            this.snackBar.open('Failed to generate device report', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Failed to load devices for report:', error);
        this.snackBar.open('Failed to load device data', 'Close', { duration: 3000 });
      }
    });
  }

  private downloadFile(blob: Blob, filename: string, format: 'pdf' | 'excel'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open(`${format.toUpperCase()} report downloaded successfully!`, 'Close', { duration: 3000 });
  }
}