<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\BuildSystemController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SettingsController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Hometronix API is running',
        'timestamp' => now()
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (SimpleTokenAuth)
|--------------------------------------------------------------------------
*/

Route::middleware('simpleauth')->group(function () {

    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // Password
    Route::get('/users/password-status', [AuthController::class, 'passwordStatus']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/upload-default-logo', [SettingsController::class, 'uploadDefaultLogo']);
    Route::delete('/settings/delete-default-logo', [SettingsController::class, 'deleteDefaultLogo']);
    Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Projects
    Route::apiResource('projects', ProjectController::class);
    Route::get('/projects/{id}/devices', [ProjectController::class, 'getProjectDevices']);
    Route::post('/projects/{id}/devices', [ProjectController::class, 'associateDevices']);
    Route::post('/projects/{id}/add-devices', [ProjectController::class, 'addDevicesToProject']);
    Route::post('/projects/{id}/import-build-system', [ProjectController::class, 'importBuildSystem']);
    Route::put('/projects/{projectId}/devices/{deviceId}', [ProjectController::class, 'updateProjectDevice']);
    Route::delete('/projects/{projectId}/devices/{deviceId}', [ProjectController::class, 'removeProjectDevice']);
    Route::get('/projects/{id}/export-pdf', [ProjectController::class, 'exportPDF']);

    // Devices
    Route::apiResource('devices', DeviceController::class);
    Route::patch('/devices/{id}/toggle-status', [DeviceController::class, 'toggleStatus']);
    Route::post('/devices/import-excel', [DeviceController::class, 'importExcel']);

    // Build Systems
    Route::apiResource('build-systems', BuildSystemController::class);
    Route::post('/build-systems/{id}/import-to-project', [BuildSystemController::class, 'importToProject']);
    Route::post('/build-systems/{id}/clone', [BuildSystemController::class, 'clone']);
    Route::patch('/build-systems/{id}/toggle-active', [BuildSystemController::class, 'toggleActive']);

    // Reports
    Route::get('/reports/projects', [ReportsController::class, 'getProjectStats']);
    Route::get('/reports/revenue', [ReportsController::class, 'getRevenueStats']);
    Route::get('/reports/devices', [ReportsController::class, 'getDeviceStats']);
    Route::get('/reports/projects/export', [ReportsController::class, 'exportProjectReport']);
    Route::get('/reports/revenue/export', [ReportsController::class, 'exportRevenueReport']);
    Route::post('/reports/devices/export', [ReportsController::class, 'exportDeviceReport']);
    
});
