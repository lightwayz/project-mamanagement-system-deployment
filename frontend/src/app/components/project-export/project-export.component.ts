import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { Project } from '../../models/project.model';

export interface ProjectExportData {
  project: Project;
}

@Component({
  selector: 'app-project-export',
  templateUrl: './project-export.component.html',
  styleUrls: ['./project-export.component.scss']
})
export class ProjectExportComponent {
  isGenerating = false;
  exportOptions = {
    includeCover: true,
    includeOverview: true,
    includeScopeOfWork: true,
    includeEquipmentPricing: true,
    includeTermsConditions: true
  };

  constructor(
    public dialogRef: MatDialogRef<ProjectExportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectExportData,
    private pdfGenerator: PdfGeneratorService,
    private snackBar: MatSnackBar
  ) {}

  async generatePDF(): Promise<void> {
    if (!this.data.project) {
      this.snackBar.open('Project data not available', 'Close', { duration: 3000 });
      return;
    }

    this.isGenerating = true;
    
    try {
      await this.pdfGenerator.generateProjectProposal(this.data.project);
      this.snackBar.open('Project proposal generated successfully!', 'Close', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.snackBar.open('Error generating PDF. Please try again.', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isGenerating = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getProjectSummary(): string {
    if (!this.data.project) return 'No project data available';
    
    const locationCount = this.data.project.locations?.length || 0;
    const deviceCount = this.data.project.locations?.reduce((total, location) => 
      total + (location.devices?.length || 0), 0) || 0;
    
    return `${locationCount} location${locationCount !== 1 ? 's' : ''}, ${deviceCount} device${deviceCount !== 1 ? 's' : ''}`;
  }
}