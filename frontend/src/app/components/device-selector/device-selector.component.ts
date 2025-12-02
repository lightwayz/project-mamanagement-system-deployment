import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Device } from '../../models/device.model';
import { DeviceSelectionItem, CreateProjectDeviceRequest } from '../../models/project.model';
import { BuildSystem } from '../../models/build-system.model';

@Component({
  selector: 'app-device-selector',
  template: `
    <div class="device-selector-container">
      <!-- Tab Navigation -->
      <mat-tab-group [(selectedIndex)]="selectedTabIndex" class="selector-tabs">
        <mat-tab label="Individual Devices">
          <div class="tab-content">
            <!-- Header with search and filters -->
            <div class="selector-header">
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search devices</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Search by name, model, or description">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        
        <div class="filter-section">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Category</mat-label>
            <mat-select [formControl]="categoryControl">
              <mat-option value="">All Categories</mat-option>
              <mat-option *ngFor="let category of categories" [value]="category">
                {{category}}
              </mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Brand</mat-label>
            <mat-select [formControl]="brandControl">
              <mat-option value="">All Brands</mat-option>
              <mat-option *ngFor="let brand of brands" [value]="brand">
                {{brand}}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Selection summary -->
      <div class="selection-summary" *ngIf="hasSelections()">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-text">
                <span class="selected-count">{{getSelectedCount()}} devices selected</span>
                <span class="total-cost">Total: {{ getTotalCost() | appCurrency }}</span>
              </div>
              <div class="summary-actions">
                <button mat-stroked-button (click)="clearSelections()" class="clear-btn">
                  Clear All
                </button>
                <button mat-flat-button color="primary" (click)="confirmSelection()" class="confirm-btn">
                  Add Selected Devices
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Device selection table -->
      <div class="table-container">
        <mat-table [dataSource]="dataSource" matSort class="devices-table">
          
          <!-- Selection column -->
          <ng-container matColumnDef="select">
            <mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                [checked]="selection.hasValue() && isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
                (change)="masterToggle()">
              </mat-checkbox>
            </mat-header-cell>
            <mat-cell *matCellDef="let device">
              <mat-checkbox
                [checked]="selection.isSelected(device)"
                (change)="toggleDevice(device)">
              </mat-checkbox>
            </mat-cell>
          </ng-container>

          <!-- Image column -->
          <ng-container matColumnDef="image">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let device">
              <div class="device-image">
                <img *ngIf="device.image_url" [src]="device.image_url" [alt]="device.name" class="device-thumbnail">
                <mat-icon *ngIf="!device.image_url" class="no-image-icon">devices</mat-icon>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Device info column -->
          <ng-container matColumnDef="device_info">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Device</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <div class="device-info">
                <div class="device-name">{{device.name}}</div>
                <div class="device-details">
                  <span class="brand">{{device.brand}}</span>
                  <span class="model">{{device.model}}</span>
                </div>
                <div class="device-category">{{device.category}}</div>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Price column -->
          <ng-container matColumnDef="price">
            <mat-header-cell *matHeaderCellDef mat-sort-header>Price</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <div class="price-info">
                <div class="selling-price">{{ device.selling_price | appCurrency }}</div>
                <div class="cost-price" *ngIf="device.cost_price">
                  Cost: {{ device.cost_price | appCurrency }}
                </div>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Quantity column -->
          <ng-container matColumnDef="quantity">
            <mat-header-cell *matHeaderCellDef>Quantity</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <mat-form-field appearance="outline" class="quantity-field" *ngIf="selection.isSelected(device)">
                <input matInput 
                       type="number" 
                       min="1" 
                       [value]="device.selectedQuantity || 1"
                       (input)="updateQuantity(device, $event)"
                       placeholder="1">
              </mat-form-field>
              <span *ngIf="!selection.isSelected(device)" class="quantity-placeholder">-</span>
            </mat-cell>
          </ng-container>

          <!-- Custom price column -->
          <ng-container matColumnDef="custom_price">
            <mat-header-cell *matHeaderCellDef>Custom Price</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <mat-form-field appearance="outline" class="price-field" *ngIf="selection.isSelected(device)">
                <input matInput 
                       type="number" 
                       min="0" 
                       step="0.01"
                       [value]="device.selectedPrice || device.selling_price"
                       (input)="updatePrice(device, $event)"
                       [placeholder]="device.selling_price.toString()">
              </mat-form-field>
              <span *ngIf="!selection.isSelected(device)" class="price-placeholder">-</span>
            </mat-cell>
          </ng-container>

          <!-- Location column -->
          <ng-container matColumnDef="location">
            <mat-header-cell *matHeaderCellDef>Location</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <mat-form-field appearance="outline" class="location-field" *ngIf="selection.isSelected(device) && locations.length > 0">
                <mat-label>Select Location</mat-label>
                <mat-select [value]="device.assignedLocation || getDefaultLocation()" 
                           (selectionChange)="updateDeviceLocation(device, $event.value)">
                  <mat-option *ngFor="let location of locations" [value]="location.name">
                    {{location.name}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <span *ngIf="!selection.isSelected(device) || locations.length === 0" class="location-placeholder">-</span>
            </mat-cell>
          </ng-container>

          <!-- Total column -->
          <ng-container matColumnDef="total">
            <mat-header-cell *matHeaderCellDef>Total</mat-header-cell>
            <mat-cell *matCellDef="let device">
              <div class="device-total" *ngIf="selection.isSelected(device)">
                {{ getDeviceTotal(device) | appCurrency }}
              </div>
              <span *ngIf="!selection.isSelected(device)" class="total-placeholder">-</span>
            </mat-cell>
          </ng-container>

          <!-- Header and row definitions -->
          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;" 
                   [class.selected-row]="selection.isSelected(row)">
          </mat-row>
        </mat-table>

        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons></mat-paginator>
      </div>

      <!-- Loading state -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading devices...</p>
      </div>

            <!-- Empty state -->
            <div class="empty-state" *ngIf="!isLoading && dataSource.data.length === 0">
              <mat-icon class="empty-icon">devices_other</mat-icon>
              <h3>No devices found</h3>
              <p>Try adjusting your search criteria or filters.</p>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Build Systems">
          <div class="tab-content">
            <!-- Build System Header -->
            <div class="build-system-header">
              <div class="search-section">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>Search build systems</mat-label>
                  <input matInput [formControl]="buildSystemSearchControl" placeholder="Search by name or description">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
              </div>
            </div>

            <!-- Build System Selection Summary -->
            <div class="build-system-selection-summary" *ngIf="selectedBuildSystem">
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-content">
                    <div class="summary-text">
                      <span class="selected-system">Selected: {{selectedBuildSystem.name}}</span>
                      <span class="system-cost">Total: {{ selectedBuildSystem.total_cost | appCurrency }}</span>
                      <span class="system-details">{{selectedBuildSystem.locations?.length || 0}} locations, {{selectedBuildSystem.total_devices || 0}} devices</span>
                    </div>
                    <div class="summary-actions">
                      <button mat-stroked-button (click)="clearBuildSystemSelection()" class="clear-btn">
                        Clear Selection
                      </button>
                      <button mat-flat-button color="primary" (click)="confirmBuildSystemSelection()" class="confirm-btn">
                        Add Build System
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Build Systems Grid -->
            <div class="build-systems-grid" *ngIf="!isBuildSystemsLoading && buildSystems.length > 0">
              <mat-card *ngFor="let system of filteredBuildSystems"
                       class="build-system-card"
                       [class.selected]="selectedBuildSystem?.id === system.id"
                       (click)="selectBuildSystem(system)">
                <mat-card-header>
                  <mat-card-title>{{system.name}}</mat-card-title>
                  <mat-card-subtitle *ngIf="system.description">{{system.description}}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="system-stats">
                    <div class="stat-item">
                      <mat-icon>location_on</mat-icon>
                      <span>{{system.locations_count || 0}} locations</span>
                    </div>
                    <div class="stat-item">
                      <mat-icon>devices</mat-icon>
                      <span>{{system.total_devices || 0}} devices</span>
                    </div>
                    <div class="stat-item cost">
                      <mat-icon>attach_money</mat-icon>
                      <span>{{ system.total_cost | appCurrency }}</span>
                    </div>
                  </div>
                  <div class="system-creator" *ngIf="system.creator">
                    <small>Created by: {{system.creator.name}}</small>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Build Systems Loading -->
            <div class="loading-container" *ngIf="isBuildSystemsLoading">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Loading build systems...</p>
            </div>

            <!-- Build Systems Empty State -->
            <div class="empty-state" *ngIf="!isBuildSystemsLoading && filteredBuildSystems.length === 0">
              <mat-icon class="empty-icon">account_tree</mat-icon>
              <h3>No build systems found</h3>
              <p>No build systems match your search criteria.</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .device-selector-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 500px;
    }

    .selector-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background: var(--surface-color, #f8f9fa);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e9ecef);
    }

    .search-section {
      display: flex;
      gap: 16px;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .filter-section {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-field {
      min-width: 150px;
    }

    .selection-summary {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .summary-card {
      border: 2px solid #20bf6b;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
    }

    .summary-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 8px 0;
    }

    .summary-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .selected-count {
      font-weight: 600;
      color: #2d3436;
    }

    .total-cost {
      font-size: 18px;
      font-weight: 700;
      color: #20bf6b;
    }

    .summary-actions {
      display: flex;
      gap: 12px;
    }

    .clear-btn {
      border-color: #e74c3c;
      color: #e74c3c;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #20bf6b 0%, #01a3a4 100%);
      color: white;
      min-width: 180px;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .devices-table {
      width: 100%;
      min-width: 1100px;
      background: var(--surface-color, white);
      table-layout: auto;
    }

    .devices-table .mat-mdc-cell,
    .devices-table .mat-mdc-header-cell {
      padding: 12px 8px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: middle;
    }

    .devices-table .mat-mdc-cell:not(.mat-column-device_info),
    .devices-table .mat-mdc-header-cell:not(.mat-column-device_info) {
      white-space: nowrap;
    }

    .devices-table .mat-mdc-header-cell {
      background-color: var(--header-bg, #f8f9fa);
      font-weight: 600;
      color: var(--text-primary, #374151);
      font-size: 13px;
    }

    .selected-row {
      background-color: #f0f8ff !important;
      border-left: 4px solid #20bf6b;
    }

    /* Flexible column layout */
    .mat-column-select {
      min-width: 60px;
      width: 60px;
      text-align: center;
    }

    .mat-column-image {
      min-width: 80px;
      width: 80px;
      text-align: center;
    }

    .mat-column-device_info {
      min-width: 300px;
      width: auto;
      text-align: left;
    }

    .mat-column-price {
      min-width: 140px;
      width: 140px;
      text-align: right;
    }

    .mat-column-quantity {
      min-width: 130px;
      width: 130px;
      text-align: center;
    }

    .mat-column-custom_price {
      min-width: 150px;
      width: 150px;
      text-align: center;
    }

    .mat-column-location {
      min-width: 200px;
      width: 200px;
      text-align: center;
    }

    .mat-column-total {
      min-width: 140px;
      width: 140px;
      text-align: right;
    }

    .device-image {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
      background: var(--image-bg, #f8f9fa);
    }

    .device-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image-icon {
      color: #6c757d;
      font-size: 24px;
    }

    .device-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px 0;
      max-width: 300px;
    }

    .device-name {
      font-weight: 600;
      color: var(--text-primary, #2d3436);
      font-size: 14px;
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .device-details {
      display: flex;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary, #6c757d);
      flex-wrap: wrap;
    }

    .brand {
      font-weight: 500;
    }

    .device-category {
      font-size: 11px;
      color: #20bf6b;
      font-weight: 500;
      white-space: nowrap;
    }

    .price-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: right;
    }

    .selling-price {
      font-weight: 600;
      color: var(--text-primary, #2d3436);
    }

    .cost-price {
      font-size: 12px;
      color: var(--text-secondary, #6c757d);
    }

    .quantity-field {
      width: 110px;
    }

    .price-field {
      width: 130px;
    }

    .location-field {
      width: 180px;
    }

    .quantity-field .mat-mdc-form-field-infix,
    .price-field .mat-mdc-form-field-infix,
    .location-field .mat-mdc-form-field-infix {
      min-height: 36px;
      padding: 0 8px;
    }

    .quantity-field input,
    .price-field input {
      text-align: center;
      font-size: 14px;
    }

    .quantity-placeholder,
    .price-placeholder,
    .location-placeholder,
    .total-placeholder {
      color: #adb5bd;
      font-style: italic;
    }

    .device-total {
      font-weight: 600;
      color: #20bf6b;
      text-align: right;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      text-align: center;
      color: #6c757d;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #adb5bd;
    }

    /* Tab Navigation Styles */
    .selector-tabs {
      width: 100%;
    }

    .tab-content {
      padding: 16px 0;
    }

    /* Build System Styles */
    .build-system-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background: var(--surface-color, #f8f9fa);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e9ecef);
      margin-bottom: 20px;
    }

    .build-system-selection-summary {
      margin-bottom: 20px;
    }

    .build-systems-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .build-system-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      border-radius: 12px;
    }

    .build-system-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-color: #e9ecef;
    }

    .build-system-card.selected {
      border-color: #20bf6b;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
    }

    .build-system-card mat-card-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3436;
      margin-bottom: 4px;
    }

    .build-system-card mat-card-subtitle {
      font-size: 14px;
      color: #6c757d;
      line-height: 1.4;
    }

    .system-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
    }

    .stat-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #6c757d;
    }

    .stat-item.cost {
      font-weight: 600;
      color: #20bf6b;
    }

    .stat-item.cost mat-icon {
      color: #20bf6b;
    }

    .system-creator {
      padding-top: 8px;
      border-top: 1px solid #e9ecef;
    }

    .system-creator small {
      color: #6c757d;
      font-style: italic;
    }

    /* Dark theme support for build systems */
    .dark-theme .build-system-header {
      background: var(--surface-color);
      border-color: var(--border-color);
    }

    .dark-theme .build-system-card {
      background: var(--surface-color);
      border-color: var(--border-color);
    }

    .dark-theme .build-system-card:hover {
      border-color: var(--border-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .dark-theme .build-system-card.selected {
      border-color: #20bf6b;
      background: rgba(32, 191, 107, 0.1);
    }

    .dark-theme .build-system-card mat-card-title {
      color: var(--text-primary);
    }

    .dark-theme .build-system-card mat-card-subtitle {
      color: var(--text-secondary);
    }

    .dark-theme .stat-item {
      color: var(--text-primary);
    }

    .dark-theme .stat-item mat-icon {
      color: var(--text-secondary);
    }

    .dark-theme .stat-item.cost,
    .dark-theme .stat-item.cost mat-icon {
      color: #20bf6b;
    }

    .dark-theme .system-creator {
      border-top-color: var(--border-color);
    }

    .dark-theme .system-creator small {
      color: var(--text-secondary);
    }

    /* Responsive design */
    @media (max-width: 1400px) {
      .devices-table {
        min-width: 1000px;
      }

      .mat-column-device_info {
        min-width: 250px;
        width: 250px;
      }

      .mat-column-location {
        min-width: 180px;
        width: 180px;
      }

      .location-field {
        width: 160px;
      }
    }

    @media (max-width: 1200px) {
      .selector-header {
        padding: 12px;
      }

      .filter-section {
        flex-direction: column;
        gap: 12px;
      }

      .filter-field {
        width: 100%;
        max-width: none;
      }

      .mat-column-device_info {
        width: 220px;
      }

      .mat-column-price,
      .mat-column-custom_price,
      .mat-column-total {
        width: 120px;
      }

      .mat-column-location {
        width: 160px;
      }

      .location-field {
        width: 140px;
      }
    }

    @media (max-width: 768px) {
      .summary-content {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .summary-actions {
        justify-content: stretch;
      }

      .summary-actions button {
        flex: 1;
      }

      .build-systems-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .build-system-card {
        margin: 0;
      }

      .system-stats {
        gap: 6px;
      }

      .stat-item {
        font-size: 13px;
      }

      .devices-table {
        font-size: 13px;
      }

      .mat-column-device_info {
        width: 180px;
      }

      .mat-column-price,
      .mat-column-custom_price,
      .mat-column-total {
        width: 100px;
      }

      .mat-column-quantity {
        width: 90px;
      }

      .mat-column-location {
        width: 140px;
      }

      .quantity-field {
        width: 70px;
      }

      .price-field {
        width: 85px;
      }

      .location-field {
        width: 120px;
      }

      .device-name {
        font-size: 12px;
      }

      .device-details {
        font-size: 11px;
      }
    }

    /* Dark Mode Support */
    :host-context(.dark-theme) .selector-header {
      background: var(--surface-color);
      border-color: var(--border-color);
    }

    :host-context(.dark-theme) .devices-table {
      background: var(--surface-color);
    }

    :host-context(.dark-theme) .devices-table .mat-mdc-cell,
    :host-context(.dark-theme) .devices-table .mat-mdc-header-cell {
      border-bottom-color: var(--border-color);
    }

    :host-context(.dark-theme) .devices-table .mat-mdc-header-cell {
      background-color: var(--header-bg);
      color: var(--text-primary);
    }

    :host-context(.dark-theme) .selected-row {
      background-color: rgba(32, 191, 107, 0.15) !important;
    }

    :host-context(.dark-theme) .device-image {
      background: var(--image-bg);
    }

    :host-context(.dark-theme) .no-image-icon {
      color: var(--text-secondary);
    }

    :host-context(.dark-theme) .device-name {
      color: var(--text-primary);
    }

    :host-context(.dark-theme) .device-details {
      color: var(--text-secondary);
    }

    :host-context(.dark-theme) .selling-price {
      color: var(--text-primary);
    }

    :host-context(.dark-theme) .cost-price {
      color: var(--text-secondary);
    }

    :host-context(.dark-theme) .empty-state {
      color: var(--text-secondary);
    }

    :host-context(.dark-theme) .empty-icon {
      color: var(--text-disabled);
    }

    :host-context(.dark-theme) .build-system-header {
      background: var(--surface-color);
      border-color: var(--border-color);
    }
  `]
})
export class DeviceSelectorComponent implements OnInit {
  @Input() selectedDevices: DeviceSelectionItem[] = [];
  @Input() locations: { name: string; description: string; id?: string }[] = [];
  @Input() allowMultipleSelection = true;
  @Input() showPriceOverride = true;
  @Output() devicesSelected = new EventEmitter<CreateProjectDeviceRequest[]>();
  @Output() selectionChanged = new EventEmitter<DeviceSelectionItem[]>();
  @Output() buildSystemSelected = new EventEmitter<BuildSystem>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['select', 'image', 'device_info', 'price', 'quantity', 'custom_price', 'location', 'total'];
  dataSource = new MatTableDataSource<DeviceSelectionItem>([]);
  selection = new SelectionModel<DeviceSelectionItem>(true, []);
  
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  brandControl = new FormControl('');
  buildSystemSearchControl = new FormControl('');

  devices: DeviceSelectionItem[] = [];
  categories: string[] = [];
  brands: string[] = [];
  isLoading = false;

  // Build System properties
  selectedTabIndex = 0;
  buildSystems: BuildSystem[] = [];
  filteredBuildSystems: BuildSystem[] = [];
  selectedBuildSystem: BuildSystem | null = null;
  isBuildSystemsLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDevices();
    this.loadBuildSystems();
    this.setupFilters();

    // Initialize with any pre-selected devices
    if (this.selectedDevices.length > 0) {
      this.selectedDevices.forEach(device => {
        this.selection.select(device);
      });
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    // Category filter
    this.categoryControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Brand filter
    this.brandControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Build system search filter
    this.buildSystemSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyBuildSystemFilters();
    });
  }

  private loadDevices(): void {
    this.isLoading = true;
    this.apiService.get<{success: boolean, data: Device[]}>('/devices').subscribe({
      next: (response) => {
        const devices = response.data || response;
        this.devices = devices.map((device: any) => ({
          ...device,
          selected: false,
          selectedQuantity: 1,
          selectedPrice: device.selling_price
        }));
        
        this.dataSource.data = this.devices;
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load devices:', error);
        this.isLoading = false;
      }
    });
  }

  private extractFilterOptions(): void {
    this.categories = [...new Set(this.devices.map(d => d.category))].sort();
    this.brands = [...new Set(this.devices.map(d => d.brand))].sort();
  }

  private applyFilters(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const categoryFilter = this.categoryControl.value || '';
    const brandFilter = this.brandControl.value || '';

    this.dataSource.data = this.devices.filter(device => {
      const matchesSearch = !searchTerm || 
        device.name.toLowerCase().includes(searchTerm) ||
        device.model.toLowerCase().includes(searchTerm) ||
        (device.description && device.description.toLowerCase().includes(searchTerm));

      const matchesCategory = !categoryFilter || device.category === categoryFilter;
      const matchesBrand = !brandFilter || device.brand === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }

  toggleDevice(device: DeviceSelectionItem): void {
    if (this.selection.isSelected(device)) {
      this.selection.deselect(device);
      device.selected = false;
      device.assignedLocation = undefined;
    } else {
      this.selection.select(device);
      device.selected = true;
      device.selectedQuantity = device.selectedQuantity || 1;
      device.selectedPrice = device.selectedPrice || device.selling_price;
      device.assignedLocation = device.assignedLocation || this.getDefaultLocation();
    }
    
    this.emitSelectionChange();
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataSource.data.forEach(device => {
        device.selected = false;
        device.assignedLocation = undefined;
      });
    } else {
      this.dataSource.data.forEach(device => {
        this.selection.select(device);
        device.selected = true;
        device.selectedQuantity = device.selectedQuantity || 1;
        device.selectedPrice = device.selectedPrice || device.selling_price;
        device.assignedLocation = device.assignedLocation || this.getDefaultLocation();
      });
    }
    
    this.emitSelectionChange();
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  updateQuantity(device: DeviceSelectionItem, event: any): void {
    const quantity = parseInt(event.target.value) || 1;
    device.selectedQuantity = Math.max(1, quantity);
    this.emitSelectionChange();
  }

  updatePrice(device: DeviceSelectionItem, event: any): void {
    const price = parseFloat(event.target.value) || device.selling_price;
    device.selectedPrice = Math.max(0, price);
    this.emitSelectionChange();
  }

  getDeviceTotal(device: DeviceSelectionItem): number {
    const quantity = device.selectedQuantity || 1;
    const price = device.selectedPrice || device.selling_price;
    return quantity * price;
  }

  getTotalCost(): number {
    return this.selection.selected.reduce((total, device) => {
      return total + this.getDeviceTotal(device);
    }, 0);
  }

  getSelectedCount(): number {
    return this.selection.selected.length;
  }

  hasSelections(): boolean {
    return this.selection.selected.length > 0;
  }

  clearSelections(): void {
    this.selection.clear();
    this.devices.forEach(device => {
      device.selected = false;
      device.assignedLocation = undefined;
    });
    this.emitSelectionChange();
  }

  confirmSelection(): void {
    const selectedDevices: CreateProjectDeviceRequest[] = this.selection.selected.map(device => ({
      device_id: device.id,
      quantity: device.selectedQuantity || 1,
      unit_price: device.selectedPrice || device.selling_price
    }));

    this.devicesSelected.emit(selectedDevices);
  }

  private emitSelectionChange(): void {
    this.selectionChanged.emit(this.selection.selected);
  }

  getDefaultLocation(): string {
    return this.locations.length > 0 ? this.locations[0].name : '';
  }

  updateDeviceLocation(device: DeviceSelectionItem, locationName: string): void {
    device.assignedLocation = locationName;
    this.emitSelectionChange();
  }

  // Build System Methods
  private loadBuildSystems(): void {
    this.isBuildSystemsLoading = true;
    this.apiService.get<{success: boolean, data: BuildSystem[]}>('/build-systems').subscribe({
      next: (response) => {
        const buildSystems = response.data || response;
        this.buildSystems = Array.isArray(buildSystems) ? buildSystems : [];
        this.filteredBuildSystems = [...this.buildSystems];
        this.isBuildSystemsLoading = false;
      },
      error: (error) => {
        console.error('Failed to load build systems:', error);
        this.buildSystems = [];
        this.filteredBuildSystems = [];
        this.isBuildSystemsLoading = false;
      }
    });
  }

  private applyBuildSystemFilters(): void {
    const searchTerm = this.buildSystemSearchControl.value?.toLowerCase() || '';

    this.filteredBuildSystems = this.buildSystems.filter(system => {
      return !searchTerm ||
        system.name.toLowerCase().includes(searchTerm) ||
        (system.description && system.description.toLowerCase().includes(searchTerm));
    });
  }

  selectBuildSystem(system: BuildSystem): void {
    this.selectedBuildSystem = system;
  }

  clearBuildSystemSelection(): void {
    this.selectedBuildSystem = null;
  }

  confirmBuildSystemSelection(): void {
    if (this.selectedBuildSystem) {
      this.buildSystemSelected.emit(this.selectedBuildSystem);
    }
  }
}