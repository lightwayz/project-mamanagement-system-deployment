import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ExcelImportDialogComponent } from '../excel-import-dialog/excel-import-dialog.component';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_clients: number;
  monthly_revenue: number;
  pending_proposals: number;
  low_stock_items: number;
  total_users: number;
  total_devices: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats = {
    total_projects: 0,
    active_projects: 0,
    total_clients: 0,
    monthly_revenue: 0,
    pending_proposals: 0,
    low_stock_items: 0,
    total_users: 0,
    total_devices: 0
  };
  isLoading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.apiService.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  openExcelImport(): void {
    const dialogRef = this.dialog.open(ExcelImportDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'excel-import-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success_count > 0) {
        // Refresh dashboard stats if devices were imported
        this.loadDashboardStats();
      }
    });
  }
}