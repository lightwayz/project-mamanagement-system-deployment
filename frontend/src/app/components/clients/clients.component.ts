import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';
import { AddClientDialogComponent } from '../add-client-dialog/add-client-dialog.component';
import { EditClientDialogComponent } from '../edit-client-dialog/edit-client-dialog.component';

@Component({
  selector: 'app-clients',
  template: `
    <div class="clients-container">
      <div class="header">
        <h2>Clients</h2>
        <button mat-raised-button color="primary" (click)="addClient()">
          <mat-icon>add</mat-icon>
          Add Client
        </button>
      </div>
      
      <mat-card>
        <mat-card-content>
          <mat-table [dataSource]="clients" class="mat-elevation-z8">
            <ng-container matColumnDef="name">
              <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
              <mat-cell *matCellDef="let client">{{client.name}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
              <mat-cell *matCellDef="let client">{{client.email}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="phone">
              <mat-header-cell *matHeaderCellDef>Phone</mat-header-cell>
              <mat-cell *matCellDef="let client">{{client.phone}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="company">
              <mat-header-cell *matHeaderCellDef>Company</mat-header-cell>
              <mat-cell *matCellDef="let client">{{client.company || 'N/A'}}</mat-cell>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
              <mat-cell *matCellDef="let client">
                <button mat-icon-button (click)="editClient(client)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteClient(client)">
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
    .clients-container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .mat-table {
      width: 100%;
    }
  `]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'company', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.apiService.get<{data: Client[]}>('/clients').subscribe({
      next: (response) => {
        this.clients = response.data || [];
        console.log('Loaded clients for display:', this.clients);
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
        this.snackBar.open('Failed to load clients', 'Close', { duration: 3000 });
      }
    });
  }

  addClient(): void {
    const dialogRef = this.dialog.open(AddClientDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients(); // Refresh the client list
      }
    });
  }

  editClient(client: Client): void {
    const dialogRef = this.dialog.open(EditClientDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'custom-dialog-container',
      data: { client: client }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients(); // Refresh the client list
      }
    });
  }

  deleteClient(client: Client): void {
    const confirmMessage = `Are you sure you want to delete client "${client.name}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.apiService.delete(`/clients/${client.id}`).subscribe({
        next: () => {
          this.snackBar.open('Client deleted successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadClients(); // Refresh the client list
        },
        error: (error) => {
          console.error('Failed to delete client:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to delete client', 
            'Close', 
            { 
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }
}