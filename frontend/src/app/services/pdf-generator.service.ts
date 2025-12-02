import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Project } from '../models/project.model';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  constructor() {}

  async generateProjectProposal(project: Project): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate project data
        if (!project) {
          reject(new Error('Project data is required'));
          return;
        }

        if (!project.name || typeof project.name !== 'string' || project.name.trim() === '') {
          reject(new Error('Valid project name is required'));
          return;
        }

        console.log('Starting PDF generation for project:', project.name);

        // Create PDF with proper initialization
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Generate content
        this.generatePDFContent(pdf, project);

        // Generate safe filename
        const fileName = this.generateSafeFileName(project.name);

        console.log('Saving PDF with filename:', fileName);

        // Save the PDF
        pdf.save(fileName);

        console.log('PDF generation completed successfully');
        resolve();

      } catch (error: any) {
        console.error('PDF Generation Error:', error);
        reject(new Error(`PDF generation failed: ${error?.message || 'Unknown error occurred'}`));
      }
    });
  }

  private generateSafeFileName(projectName: string): string {
    // Clean project name for filename
    const cleanName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${cleanName}_Proposal_${timestamp}.pdf`;
  }

  private generatePDFContent(pdf: jsPDF, project: Project): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add cover page
    this.addSimpleCoverPage(pdf, project, pageWidth, pageHeight);

    // Add content pages
    pdf.addPage();
    this.addProjectSummary(pdf, project, pageWidth);

    // Add equipment table if devices exist
    if (this.hasDevices(project)) {
      pdf.addPage();
      this.addEquipmentTable(pdf, project, pageWidth);
    }

    // Add footer to all pages
    this.addSimpleFooters(pdf, pageWidth, pageHeight);
  }

  private hasDevices(project: Project): boolean {
    return !!(project.locations &&
           project.locations.length > 0 &&
           project.locations.some(location =>
             location.devices && location.devices.length > 0
           ));
  }

  private addSimpleCoverPage(pdf: jsPDF, project: Project, pageWidth: number, pageHeight: number): void {
    try {
      // Company header
      pdf.setFillColor(25, 118, 210); // Blue color
      pdf.rect(0, 0, pageWidth, 40, 'F');

      // Company name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HOMETRONIX NG', 20, 25);

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Smart Home Automation Solutions', 20, 32);

      // Project title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROJECT PROPOSAL', 20, 70);

      // Project name
      pdf.setFontSize(18);
      const projectName = (project.name || 'Untitled Project').substring(0, 50);
      pdf.text(projectName, 20, 90);

      // Project details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      let yPos = 120;
      const lineHeight = 10;

      // Client
      const clientName = project.client?.name || 'Not Specified';
      pdf.text(`Client: ${clientName}`, 20, yPos);
      yPos += lineHeight;

      // Status
      const status = (project.status || 'draft').charAt(0).toUpperCase() + (project.status || 'draft').slice(1);
      pdf.text(`Status: ${status}`, 20, yPos);
      yPos += lineHeight;

      // Total Cost
      const totalCost = (project.total_cost || 0).toLocaleString();
      pdf.text(`Total Cost: ₦${totalCost}`, 20, yPos);
      yPos += lineHeight;

      // Date
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Date: ${currentDate}`, 20, yPos);

      // Footer
      pdf.setFontSize(8);
      pdf.text('Prepared by: Hometronix NG Team', 20, pageHeight - 30);
      pdf.text('Contact: info@hometronixng.com', 20, pageHeight - 20);

    } catch (error) {
      console.error('Error in addSimpleCoverPage:', error);
      // Fallback: Add minimal content
      pdf.setFontSize(16);
      pdf.text('PROJECT PROPOSAL', 20, 50);
      pdf.setFontSize(12);
      pdf.text(project.name || 'Untitled Project', 20, 70);
    }
  }

  private addProjectSummary(pdf: jsPDF, project: Project, pageWidth: number): void {
    try {
      let yPos = 30;
      const lineHeight = 8;

      // Section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROJECT SUMMARY', 20, yPos);
      yPos += 20;

      // Description
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const description = project.description || 'Smart home automation project with modern technology solutions.';
      const maxWidth = pageWidth - 40;
      const descriptionLines = pdf.splitTextToSize(description.substring(0, 500), maxWidth);
      pdf.text(descriptionLines, 20, yPos);
      yPos += (descriptionLines.length * lineHeight) + 15;

      // Project details
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROJECT DETAILS:', 20, yPos);
      yPos += 10;

      pdf.setFont('helvetica', 'normal');

      // Timeline
      if (project.start_date) {
        const startDate = new Date(project.start_date).toLocaleDateString();
        pdf.text(`Start Date: ${startDate}`, 25, yPos);
        yPos += lineHeight;
      }

      if (project.end_date) {
        const endDate = new Date(project.end_date).toLocaleDateString();
        pdf.text(`End Date: ${endDate}`, 25, yPos);
        yPos += lineHeight;
      }

      // Locations count
      if (project.locations && project.locations.length > 0) {
        pdf.text(`Number of Locations: ${project.locations.length}`, 25, yPos);
        yPos += lineHeight;

        // List locations
        project.locations.forEach((location, index) => {
          if (yPos > 250) return; // Prevent overflow
          const locationName = (location?.name || `Location ${index + 1}`).substring(0, 40);
          pdf.text(`  ${index + 1}. ${locationName}`, 30, yPos);
          yPos += lineHeight;
        });
      }

    } catch (error) {
      console.error('Error in addProjectSummary:', error);
      // Fallback
      pdf.setFontSize(14);
      pdf.text('Project Summary', 20, 50);
      pdf.setFontSize(10);
      pdf.text(project.description || 'Project details will be provided.', 20, 70);
    }
  }

  private addEquipmentTable(pdf: jsPDF, project: Project, pageWidth: number): void {
    try {
      let yPos = 30;

      // Section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EQUIPMENT & PRICING', 20, yPos);
      yPos += 20;

      if (this.hasDevices(project)) {
        const tableData: any[] = [];
        let totalCost = 0;

        project.locations?.forEach(location => {
          if (location.devices && location.devices.length > 0) {
            // Location header row
            tableData.push([{
              content: location.name.toUpperCase(),
              colSpan: 4,
              styles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
            }]);

            location.devices.forEach(device => {
              const quantity = device.quantity || 0;
              const unitPrice = device.unit_price || device.device?.selling_price || 0;
              const deviceTotal = quantity * unitPrice;
              totalCost += deviceTotal;

              tableData.push([
                device.device?.name || 'Unknown Device',
                quantity.toString(),
                `₦${unitPrice.toLocaleString()}`,
                `₦${deviceTotal.toLocaleString()}`
              ]);
            });
          }
        });

        // Add total row
        tableData.push([
          { content: 'TOTAL PROJECT COST', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [25, 118, 210], textColor: [255, 255, 255] } },
          { content: `₦${totalCost.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [25, 118, 210], textColor: [255, 255, 255] } }
        ]);

        pdf.autoTable({
          startY: yPos,
          head: [['Item', 'Qty', 'Unit Price', 'Total']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [25, 118, 210] },
          styles: { fontSize: 10 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          }
        });
      } else {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Equipment pricing will be provided upon project scope confirmation.', 20, yPos);
      }

    } catch (error) {
      console.error('Error in addEquipmentTable:', error);
      // Fallback
      pdf.setFontSize(14);
      pdf.text('Equipment & Pricing', 20, 50);
      pdf.setFontSize(10);
      pdf.text('Equipment details will be provided.', 20, 70);
    }
  }

  // This method is replaced by addEquipmentTable - removed to simplify

  // This method is replaced by addEquipmentTable - removed to simplify

  // This method is removed to simplify - not essential for basic PDF generation

  private addSimpleFooters(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    try {
      const pageCount = pdf.internal.pages.length - 1;

      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        // Simple footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Hometronix NG - Smart Home Solutions', 20, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
      }
    } catch (error) {
      console.error('Error adding footers:', error);
      // Continue without footers if there's an error
    }
  }
}