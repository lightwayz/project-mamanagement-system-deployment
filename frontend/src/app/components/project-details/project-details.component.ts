import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Project } from '../../models/project.model';
import { EditProjectDialogComponent } from '../edit-project-dialog/edit-project-dialog.component';

@Component({
  selector: 'app-project-details',
  template: `
    <div class="project-details-container" *ngIf="project">
      <div class="header">
        <h2>{{project.name}}</h2>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="generateProposal()">
            <mat-icon>description</mat-icon>
            Generate Proposal
          </button>
          <button mat-raised-button color="accent" (click)="editProject()">
            <mat-icon>edit</mat-icon>
            Edit Project
          </button>
        </div>
      </div>
      
      <div class="project-info">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Project Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <strong>Client:</strong> {{project.client?.name || 'N/A'}}
              </div>
              <div class="info-item">
                <strong>Status:</strong> 
                <mat-chip [color]="getStatusColor(project.status)">
                  {{project.status | titlecase}}
                </mat-chip>
              </div>
              <div class="info-item">
                <strong>Start Date:</strong> {{project.start_date | date:'short'}}
              </div>
              <div class="info-item">
                <strong>End Date:</strong> {{project.end_date | date:'short'}}
              </div>
              <div class="info-item">
                <strong>Total Cost:</strong> {{project.total_cost | appCurrency}}
              </div>
              <div class="info-item">
                <strong>Salesperson:</strong> {{project.salesperson?.name || 'N/A'}}
              </div>
            </div>
            <div class="description">
              <strong>Description:</strong>
              <p>{{project.description}}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="project-tabs">
        <mat-tab-group>
          <mat-tab label="Locations">
            <div class="tab-content">
              <div class="locations-header">
                <h3>Project Locations</h3>
                <button mat-raised-button color="primary" (click)="addLocation()">
                  <mat-icon>add</mat-icon>
                  Add Location
                </button>
              </div>
              <div class="locations-list">
                <mat-card *ngFor="let location of project.locations" class="location-card">
                  <mat-card-header>
                    <mat-card-title>{{location.name}}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <p>{{location.description}}</p>
                    <div class="devices-list" *ngIf="location.devices && location.devices.length > 0">
                      <h4>Devices:</h4>
                      <ul>
                        <li *ngFor="let device of location.devices">
                          {{device.device?.name}} - Qty: {{device.quantity}} - {{device.total_price | appCurrency}}
                        </li>
                      </ul>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Devices">
            <div class="tab-content">
              <app-project-device-manager [projectId]="projectId"></app-project-device-manager>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .project-details-container {
      padding: 24px;
      background-color: var(--background-color);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h2 {
      color: var(--text-primary);
      margin: 0;
    }
    .actions {
      display: flex;
      gap: 16px;
    }
    .project-info mat-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      box-shadow: var(--card-shadow);
    }
    .project-info mat-card-header {
      background: var(--background-color);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }
    .project-info mat-card-title {
      color: var(--text-primary);
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }
    .info-item strong {
      color: var(--text-secondary);
    }
    .description {
      margin-top: 16px;
    }
    .description strong {
      color: var(--text-secondary);
    }
    .description p {
      color: var(--text-primary);
    }
    .tab-content {
      padding: 24px;
    }
    .locations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .locations-header h3 {
      color: var(--text-primary);
      margin: 0;
    }
    .location-card {
      margin-bottom: 16px;
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      box-shadow: var(--card-shadow);
    }
    .location-card mat-card-header {
      background: var(--background-color);
      border-bottom: 1px solid var(--border-color);
    }
    .location-card mat-card-title {
      color: var(--text-primary);
    }
    .location-card mat-card-content p {
      color: var(--text-secondary);
    }
    .devices-list h4 {
      color: var(--text-primary);
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .devices-list ul {
      margin: 0;
      padding-left: 16px;
    }
    .devices-list li {
      color: var(--text-primary);
      margin-bottom: 4px;
    }
  `]
})
export class ProjectDetailsComponent implements OnInit {
  project: Project | null = null;
  projectId: number;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.projectId = Number(this.route.snapshot.params['id']);
  }

  ngOnInit(): void {
    this.loadProject();
  }

  loadProject(): void {
    this.apiService.get<Project>(`/projects/${this.projectId}`).subscribe({
      next: (project) => {
        this.project = project;
      },
      error: (error) => {
        console.error('Failed to load project:', error);
      }
    });
  }

  generateProposal(): void {
    if (!this.project) {
      this.snackBar.open('Project not loaded', 'Close', { duration: 3000 });
      return;
    }

    const snackBarRef = this.snackBar.open('Generating PDF proposal...', '', {
      duration: 0, // Keep open until dismissed
      panelClass: ['info-snackbar']
    });

    // Call the backend API to generate and download PDF
    this.apiService.getBlob(`/projects/${this.projectId}/export-pdf`).subscribe({
      next: (blob: Blob) => {
        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Generate filename from project name
        const filename = `${this.project!.name.replace(/[^a-z0-9]/gi, '_')}_Proposal.pdf`;
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
        console.error('Failed to generate PDF proposal:', error);
        snackBarRef.dismiss();
        this.snackBar.open('Failed to generate PDF proposal. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  editProject(): void {
    if (!this.project) {
      this.snackBar.open('Project not loaded', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'custom-dialog-container',
      data: { project: this.project }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh project data after successful update
        this.loadProject();
        this.snackBar.open('Project updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  addLocation(): void {
    // TODO: Implement add location dialog
    console.log('Add location');
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