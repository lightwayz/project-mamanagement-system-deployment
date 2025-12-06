import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/* Angular Material */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';

/* NgRx */
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

/* Routing */
import { AppRoutingModule } from './app-routing.module';

/* Root */
import { AppComponent } from './app.component';

/* Components */
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UsersComponent } from './components/users/users.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProjectDetailsComponent } from './components/project-details/project-details.component';
import { ProposalComponent } from './components/proposal/proposal.component';
import { LayoutComponent } from './components/layout/layout.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';

import { AddClientDialogComponent } from './components/add-client-dialog/add-client-dialog.component';
import { AddDeviceDialogComponent } from './components/add-device-dialog/add-device-dialog.component';
import { AddProjectDialogComponent } from './components/add-project-dialog/add-project-dialog.component';
import { AddUserDialogComponent } from './components/add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from './components/edit-user-dialog/edit-user-dialog.component';
import { ExcelImportDialogComponent } from './components/excel-import-dialog/excel-import-dialog.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { PasswordExpiryNotificationComponent } from './components/password-expiry-notification/password-expiry-notification.component';
import { PasswordNotificationComponent } from './components/password-notification/password-notification.component';

import { DeviceSelectorComponent } from './components/device-selector/device-selector.component';
import { ProjectDeviceManagerComponent } from './components/project-device-manager/project-device-manager.component';
import { EditProjectDialogComponent } from './components/edit-project-dialog/edit-project-dialog.component';
import { ProjectExportComponent } from './components/project-export/project-export.component';
import { EditClientDialogComponent } from './components/edit-client-dialog/edit-client-dialog.component';

import { BuildSystemsComponent } from './components/build-systems/build-systems.component';
import { AddBuildSystemDialogComponent } from './components/add-build-system-dialog/add-build-system-dialog.component';
import { BuildSystemDetailsComponent } from './components/build-system-details/build-system-details.component';
import { EditBuildSystemDialogComponent } from './components/edit-build-system-dialog/edit-build-system-dialog.component';

import { ProjectDeviceSelectionDialogComponent } from './components/project-device-selection-dialog/project-device-selection-dialog.component';
import { SimpleDeviceSelectorComponent } from './components/simple-device-selector/simple-device-selector.component';

/* Pipes */
import { CurrencyPipe } from './pipes/currency.pipe';

/* Guards */
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

/* Interceptors */
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

/* Store */
import { reducers } from './store/reducers';
import { AuthEffects } from './store/effects/auth.effects';
import { ProjectEffects } from './store/effects/project.effects';
import { ClientEffects } from './store/effects/client.effects';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    ClientsComponent,
    ProjectsComponent,
    InventoryComponent,
    SettingsComponent,
    UsersComponent,
    ReportsComponent,
    ProjectDetailsComponent,
    ProposalComponent,
    LayoutComponent,
    PasswordChangeComponent,

    AddClientDialogComponent,
    AddDeviceDialogComponent,
    AddProjectDialogComponent,
    AddUserDialogComponent,
    EditUserDialogComponent,
    ExcelImportDialogComponent,
    ExportDialogComponent,

    PasswordExpiryNotificationComponent,
    PasswordNotificationComponent,

    DeviceSelectorComponent,
    ProjectDeviceManagerComponent,
    EditProjectDialogComponent,
    ProjectExportComponent,
    EditClientDialogComponent,

    BuildSystemsComponent,
    AddBuildSystemDialogComponent,
    BuildSystemDetailsComponent,
    EditBuildSystemDialogComponent,

    ProjectDeviceSelectionDialogComponent,
    SimpleDeviceSelectorComponent,

    CurrencyPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,

    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatExpansionModule,
    MatMenuModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatDividerModule,
    MatStepperModule,

    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([
      AuthEffects,
      ProjectEffects,
      ClientEffects
    ]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: false
    })
  ],
  providers: [
    AuthGuard,
    RoleGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
