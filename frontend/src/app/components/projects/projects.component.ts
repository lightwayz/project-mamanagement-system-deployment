import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Project } from '../../models/project.model';
import { AddProjectDialogComponent } from '../add-project-dialog/add-project-dialog.component';
import { EditProjectDialogComponent } from '../edit-project-dialog/edit-project-dialog.component';
import { ProjectExportComponent } from '../project-export/project-export.component';

@Component({
  selector: 'app-projects',
  template: `
    <div class="projects-container">
      <div class="header">
        <h2>Projects</h2>
        <button mat-raised-button color="primary" (click)="addProject()">
          <mat-icon>add</mat-icon>
          Add Project
        </button>
      </div>
      
      <mat-card>
        <mat-card-content>
          <mat-table [dataSource]="projects" class="mat-elevation-z8">
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
              <mat-cell *matCellDef="let project">{{project.name}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="client">
              <mat-header-cell *matHeaderCellDef>Client</mat-header-cell>
              <mat-cell *matCellDef="let project">{{project.client?.name || 'N/A'}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
              <mat-cell *matCellDef="let project">
                <mat-chip [color]="getStatusColor(project.status)">
                  {{project.status | titlecase}}
                </mat-chip>
              </mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="total_cost">
              <mat-header-cell *matHeaderCellDef>Total Cost</mat-header-cell>
              <mat-cell *matCellDef="let project">{{ project.total_cost | appCurrency }}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
              <mat-cell *matCellDef="let project">
                <button mat-icon-button (click)="viewProject(project)" matTooltip="View Project">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button (click)="editProject(project)" matTooltip="Edit Project">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="exportProject(project)" matTooltip="Export PDF">
                  <mat-icon>picture_as_pdf</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteProject(project)" matTooltip="Delete Project" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-cell>
            </ng-container>
            
            <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
          </mat-table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .projects-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }
    .mat-table {
      width: 100%;
      overflow-x: auto;
    }
    .mat-cell, .mat-header-cell {
      padding: 12px 8px;
    }
    .mat-column-actions {
      width: 150px;
      text-align: center;
    }
    .mat-column-total_cost {
      text-align: right;
      width: 120px;
    }
    .mat-column-status {
      width: 100px;
    }
    .mat-chip {
      font-size: 12px;
      min-height: 24px;
      padding: 4px 8px;
    }
    
    /* Mobile responsive table */
    @media (max-width: 768px) {
      .projects-container {
        padding: 16px;
      }
      
      .header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .header h2 {
        font-size: 20px;
        text-align: center;
      }
      
      .header button {
        width: 100%;
        height: 48px;
        border-radius: 24px;
        font-size: 16px;
      }
      
      mat-card {
        margin: 0 -8px;
        border-radius: 12px;
      }
      
      .mat-table {
        font-size: 14px;
      }
      
      .mat-cell, .mat-header-cell {
        padding: 8px 4px;
        font-size: 12px;
      }
      
      .mat-header-cell {
        font-weight: 600;
        background-color: #f8f9fa;
      }
      
      .mat-column-name {
        width: 30%;
        min-width: 120px;
      }
      
      .mat-column-client {
        width: 25%;
        min-width: 100px;
      }
      
      .mat-column-status {
        width: 20%;
        min-width: 80px;
      }
      
      .mat-column-total_cost {
        width: 15%;
        min-width: 80px;
        text-align: right;
      }
      
      .mat-column-actions {
        width: 10%;
        min-width: 60px;
        text-align: center;
      }
      
      .mat-chip {
        font-size: 10px;
        min-height: 20px;
        padding: 2px 6px;
      }
      
      .mat-icon-button {
        width: 32px;
        height: 32px;
        line-height: 32px;
      }
      
      .mat-icon-button mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    @media (max-width: 480px) {
      .projects-container {
        padding: 12px;
      }
      
      .header h2 {
        font-size: 18px;
      }
      
      .mat-table {
        font-size: 12px;
      }
      
      .mat-cell, .mat-header-cell {
        padding: 6px 2px;
        font-size: 11px;
      }
      
      .mat-column-name {
        min-width: 100px;
      }
      
      .mat-column-client {
        min-width: 80px;
      }
      
      .mat-column-status {
        min-width: 70px;
      }
      
      .mat-column-total_cost {
        min-width: 70px;
      }
      
      .mat-column-actions {
        min-width: 50px;
      }
      
      .mat-chip {
        font-size: 9px;
        min-height: 18px;
        padding: 1px 4px;
      }
      
      .mat-icon-button {
        width: 28px;
        height: 28px;
        line-height: 28px;
      }
      
      .mat-icon-button mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  displayedColumns: string[] = ['name', 'client', 'status', 'total_cost', 'actions'];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.apiService.get<Project[]>('/projects').subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
      }
    });
  }

  addProject(): void {
    const dialogRef = this.dialog.open(AddProjectDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects(); // Refresh the project list
      }
    });
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  editProject(project: Project): void {
    // First, fetch the complete project data including relationships
    this.apiService.get<Project>(`/projects/${project.id}`).subscribe({
      next: (fullProject) => {
        const dialogRef = this.dialog.open(EditProjectDialogComponent, {
          width: '1100px',
          maxWidth: '95vw',
          disableClose: true,
          panelClass: 'custom-dialog-container',
          data: { project: fullProject }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadProjects(); // Refresh the project list
            this.snackBar.open('Project updated successfully', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Failed to load project details:', error);
        this.snackBar.open('Failed to load project details', 'Close', { duration: 3000 });
      }
    });
  }

  exportProject(project: Project): void {
    const snackBarRef = this.snackBar.open('Generating PDF proposal...', '', {
      duration: 0, // Keep open until dismissed
      panelClass: ['info-snackbar']
    });

    // Call the backend API to generate and download PDF
    this.apiService.getBlob(`/projects/${project.id}/export-pdf`).subscribe({
      next: (blob: Blob) => {
        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Generate filename from project name
        const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_Proposal.pdf`;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(downloadUrl);

        snackBarRef.dismiss();
        this.snackBar.open('PDF proposal generated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Failed to export PDF:', error);
        snackBarRef.dismiss();
        this.snackBar.open('Failed to generate PDF proposal. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteProject(project: Project): void {
    // Use a simple confirm dialog
    const confirmed = confirm(
      `Are you sure you want to delete the project "${project.name}"?\n\n` +
      `This action cannot be undone and will remove all associated devices and locations.`
    );

    if (!confirmed) {
      return;
    }

    // Show loading message
    const snackBarRef = this.snackBar.open('Deleting project...', '', {
      duration: 0,
      panelClass: ['info-snackbar']
    });

    this.apiService.delete(`/projects/${project.id}`).subscribe({
      next: () => {
        snackBarRef.dismiss();
        this.snackBar.open('Project deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadProjects(); // Refresh the project list
      },
      error: (error) => {
        console.error('Failed to delete project:', error);
        snackBarRef.dismiss();
        this.snackBar.open(
          error.error?.message || 'Failed to delete project',
          'Close',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'accent';
      case 'cancelled': return 'warn';
      default: return '';
    }
  }
}