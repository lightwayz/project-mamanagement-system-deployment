import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-proposal',
  template: `
    <div class="proposal-container">
      <div class="header">
        <h2>Project Proposal</h2>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="downloadPDF()">
            <mat-icon>download</mat-icon>
            Download PDF
          </button>
          <button mat-raised-button color="accent" (click)="emailProposal()">
            <mat-icon>email</mat-icon>
            Email to Client
          </button>
        </div>
      </div>
      
      <mat-card class="proposal-preview">
        <mat-card-content>
          <div class="proposal-header">
            <h1>Project Proposal</h1>
            <div class="company-info">
              <h2>Hometronix</h2>
              <p>Smart Home Installation Services</p>
            </div>
          </div>
          
          <div class="proposal-content">
            <div class="section">
              <h3>Client Information</h3>
              <p><strong>Name:</strong> Sample Client</p>
              <p><strong>Email:</strong> client@example.com</p>
              <p><strong>Phone:</strong> (555) 123-4567</p>
            </div>
            
            <div class="section">
              <h3>Project Details</h3>
              <p><strong>Project Name:</strong> Smart Home Installation</p>
              <p><strong>Description:</strong> Complete smart home automation system installation</p>
              <p><strong>Start Date:</strong> TBD</p>
            </div>
            
            <div class="section">
              <h3>Project Locations & Devices</h3>
              <div class="location-section">
                <h4>Living Room</h4>
                <table class="device-table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Smart Thermostat</td>
                      <td>1</td>
                      <td>$299.99</td>
                      <td>$299.99</td>
                    </tr>
                    <tr>
                      <td>Smart Light Switch</td>
                      <td>3</td>
                      <td>$24.99</td>
                      <td>$74.97</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="section">
              <h3>Cost Summary</h3>
              <table class="cost-table">
                <tr>
                  <td>Material Cost:</td>
                  <td>$1,500.00</td>
                </tr>
                <tr>
                  <td>Labor Cost:</td>
                  <td>$750.00</td>
                </tr>
                <tr>
                  <td>Subtotal:</td>
                  <td>$2,250.00</td>
                </tr>
                <tr>
                  <td>Tax (8.5%):</td>
                  <td>$191.25</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total:</strong></td>
                  <td><strong>$2,441.25</strong></td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h3>Terms & Conditions</h3>
              <ul>
                <li>50% deposit required to begin work</li>
                <li>All equipment comes with manufacturer warranty</li>
                <li>Installation includes basic setup and configuration</li>
                <li>Additional training sessions available upon request</li>
              </ul>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .proposal-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .actions {
      display: flex;
      gap: 16px;
    }
    .proposal-preview {
      max-width: 800px;
      margin: 0 auto;
    }
    .proposal-header {
      text-align: center;
      border-bottom: 2px solid #3f51b5;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .proposal-header h1 {
      margin: 0 0 16px 0;
      color: #3f51b5;
    }
    .company-info h2 {
      margin: 0 0 8px 0;
      color: #333;
    }
    .company-info p {
      margin: 0;
      color: #666;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h3 {
      color: #3f51b5;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .location-section {
      margin-bottom: 24px;
    }
    .location-section h4 {
      color: #666;
      margin-bottom: 12px;
    }
    .device-table, .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .device-table th, .device-table td {
      border: 1px solid #e0e0e0;
      padding: 8px;
      text-align: left;
    }
    .device-table th {
      background-color: #f5f5f5;
      font-weight: 500;
    }
    .cost-table {
      max-width: 300px;
      margin-left: auto;
    }
    .cost-table td {
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .cost-table td:last-child {
      text-align: right;
    }
    .total-row {
      border-top: 2px solid #3f51b5;
      font-size: 1.1em;
    }
    .total-row td {
      padding: 12px 8px;
    }
    .section ul {
      padding-left: 20px;
    }
    .section li {
      margin-bottom: 8px;
      color: #666;
    }
  `]
})
export class ProposalComponent implements OnInit {
  projectId: number;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.projectId = Number(this.route.snapshot.params['id']);
  }

  ngOnInit(): void {
    this.loadProposal();
  }

  loadProposal(): void {
    // TODO: Load actual proposal data
    console.log('Load proposal for project:', this.projectId);
  }

  downloadPDF(): void {
    // TODO: Generate and download PDF
    console.log('Download PDF');
  }

  emailProposal(): void {
    // TODO: Email proposal to client
    console.log('Email proposal');
  }
}