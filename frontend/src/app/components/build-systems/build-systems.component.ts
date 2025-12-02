import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { BuildSystem, BuildSystemFilters, BuildSystemListResponse } from '../../models/build-system.model';
import { User } from '../../models/user.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AddBuildSystemDialogComponent } from '../add-build-system-dialog/add-build-system-dialog.component';
import { BuildSystemDetailsComponent } from '../build-system-details/build-system-details.component';
import { EditBuildSystemDialogComponent } from '../edit-build-system-dialog/edit-build-system-dialog.component';

@Component({
  selector: 'app-build-systems',
  templateUrl: './build-systems.component.html',
  styleUrls: ['./build-systems.component.scss']
})
export class BuildSystemsComponent implements OnInit {
  buildSystems: BuildSystem[] = [];
  loading = false;
  currentUser: User | null = null;

  // Pagination
  totalItems = 0;
  pageSize = 15;
  currentPage = 0;

  // Filters
  searchControl = new FormControl('');
  activeFilter: boolean | null = null;
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Display columns
  displayedColumns: string[] = ['name', 'description', 'locations_count', 'total_cost', 'creator', 'created_at', 'is_active', 'actions'];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Setup search with debounce
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadBuildSystems();
    });

    this.loadBuildSystems();
  }

  loadBuildSystems(): void {
    this.loading = true;

    const filters: BuildSystemFilters = {
      search: this.searchControl.value || undefined,
      active: this.activeFilter !== null ? this.activeFilter : undefined,
      sort_by: this.sortBy,
      sort_order: this.sortOrder,
      page: this.currentPage + 1,
      per_page: this.pageSize
    };

    // Remove undefined values
    Object.keys(filters).forEach(key =>
      filters[key as keyof BuildSystemFilters] === undefined && delete filters[key as keyof BuildSystemFilters]
    );

    this.apiService.get<BuildSystemListResponse>('/build-systems', filters).subscribe({
      next: (response) => {
        this.buildSystems = response.data;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading build systems:', error);
        this.snackBar.open('Failed to load build systems', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBuildSystems();
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.currentPage = 0;
    this.loadBuildSystems();
  }

  onActiveFilterChange(active: boolean | null): void {
    this.activeFilter = active;
    this.currentPage = 0;
    this.loadBuildSystems();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.activeFilter = null;
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 0;
    this.loadBuildSystems();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AddBuildSystemDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: '80vh',
      disableClose: true,
      panelClass: 'build-system-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBuildSystems();
      }
    });
  }

  editBuildSystem(buildSystem: BuildSystem): void {
    // Fetch full build system details with all locations and devices before opening dialog
    this.loading = true;
    this.apiService.get<BuildSystem>(`/build-systems/${buildSystem.id}`).subscribe({
      next: (fullBuildSystem) => {
        this.loading = false;

        const dialogRef = this.dialog.open(EditBuildSystemDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          height: '80vh',
          disableClose: true,
          panelClass: 'edit-build-system-dialog',
          data: { buildSystem: fullBuildSystem }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadBuildSystems();
          }
        });
      },
      error: (error) => {
        console.error('Error loading build system details:', error);
        this.snackBar.open('Failed to load build system details', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  cloneBuildSystem(buildSystem: BuildSystem): void {
    if (!buildSystem || !buildSystem.id) {
      this.snackBar.open('Invalid build system data', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.apiService.post<any>(`/build-systems/${buildSystem.id}/clone`, {}).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`"${buildSystem.name}" cloned successfully`, 'Close', { duration: 3000 });
        this.loadBuildSystems();
      },
      error: (error) => {
        console.error('Error cloning build system:', error);
        this.snackBar.open('Clone feature not available yet', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  toggleStatus(buildSystem: BuildSystem): void {
    if (!buildSystem || !buildSystem.id) {
      this.snackBar.open('Invalid build system data', 'Close', { duration: 3000 });
      return;
    }

    const newStatus = !buildSystem.is_active;
    this.apiService.put(`/build-systems/${buildSystem.id}`, { is_active: newStatus }).subscribe({
      next: () => {
        buildSystem.is_active = newStatus;
        this.snackBar.open(
          `Build system ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Error updating build system status:', error);
        this.snackBar.open('Status toggle feature not available yet', 'Close', { duration: 3000 });
      }
    });
  }

  deleteBuildSystem(buildSystem: BuildSystem): void {
    if (!buildSystem || !buildSystem.id) {
      this.snackBar.open('Invalid build system data', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete "${buildSystem.name}"? This action cannot be undone.`)) {
      this.apiService.delete(`/build-systems/${buildSystem.id}`).subscribe({
        next: () => {
          this.snackBar.open('Build system deleted successfully', 'Close', { duration: 3000 });
          this.loadBuildSystems();
        },
        error: (error) => {
          console.error('Error deleting build system:', error);
          this.snackBar.open('Delete feature not available yet', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewDetails(buildSystem: BuildSystem): void {
    try {
      // Fetch detailed build system data including locations and devices
      this.apiService.get<BuildSystem>(`/build-systems/${buildSystem.id}`).subscribe({
        next: (detailedBuildSystem) => {
          const dialogRef = this.dialog.open(BuildSystemDetailsComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: false,
            panelClass: 'build-system-details-dialog',
            data: { buildSystem: detailedBuildSystem }
          });
        },
        error: (error) => {
          console.error('Error fetching build system details:', error);
          this.snackBar.open('Failed to load build system details', 'Close', { duration: 3000 });
        }
      });
    } catch (error) {
      console.error('Error opening build system details:', error);
      this.snackBar.open('Failed to open build system details', 'Close', { duration: 3000 });
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'sort';
    return this.sortOrder === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  canEdit(buildSystem: BuildSystem): boolean {
    return this.currentUser?.role === 'admin' || buildSystem.created_by === this.currentUser?.id;
  }

  canDelete(buildSystem: BuildSystem): boolean {
    return this.currentUser?.role === 'admin' || buildSystem.created_by === this.currentUser?.id;
  }
}
