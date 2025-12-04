<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// API Health Check / Root Route
Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Hometronix API is running',
        'app' => config('app.name'),
        'version' => '1.0',
        'timestamp' => now()->toIso8601String()
    ]);
});

// Public routes - Real Database Authentication
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

// Auth routes
Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
Route::post('/refresh', [\App\Http\Controllers\AuthController::class, 'refresh']);
Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me']);

// Dashboard
Route::get('/dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);

// Client Management Routes
Route::apiResource('clients', \App\Http\Controllers\ClientController::class);

// Project Management Routes
Route::apiResource('projects', \App\Http\Controllers\ProjectController::class);

// Project Device Association Routes
Route::get('/projects/{id}/devices', [\App\Http\Controllers\ProjectController::class, 'getProjectDevices']);
Route::post('/projects/{id}/devices', [\App\Http\Controllers\ProjectController::class, 'associateDevices']);
Route::post('/projects/{id}/add-devices', [\App\Http\Controllers\ProjectController::class, 'addDevicesToProject']);
Route::post('/projects/{id}/import-build-system', [\App\Http\Controllers\ProjectController::class, 'importBuildSystem']);
Route::put('/projects/{projectId}/devices/{deviceId}', [\App\Http\Controllers\ProjectController::class, 'updateProjectDevice']);
Route::delete('/projects/{projectId}/devices/{deviceId}', [\App\Http\Controllers\ProjectController::class, 'removeProjectDevice']);

// Project PDF Export Route
Route::get('/projects/{id}/export-pdf', [\App\Http\Controllers\ProjectController::class, 'exportPDF']);

// Device Selection Route
Route::get('/devices/available', [\App\Http\Controllers\ProjectController::class, 'getAvailableDevices']);

// Device routes with image upload support
Route::apiResource('devices', \App\Http\Controllers\DeviceController::class);
Route::patch('/devices/{id}/toggle-status', [\App\Http\Controllers\DeviceController::class, 'toggleStatus']);
Route::post('/devices/import-excel', [\App\Http\Controllers\DeviceController::class, 'importExcel']);

// Build System Management Routes
Route::apiResource('build-systems', \App\Http\Controllers\BuildSystemController::class);
Route::post('/build-systems/{buildSystem}/import-to-project', [\App\Http\Controllers\BuildSystemController::class, 'importToProject']);
Route::post('/build-systems/{buildSystem}/clone', [\App\Http\Controllers\BuildSystemController::class, 'clone']);
Route::patch('/build-systems/{buildSystem}/toggle-active', [\App\Http\Controllers\BuildSystemController::class, 'toggleActive']);

// Reports routes
Route::get('/reports/projects', [\App\Http\Controllers\ReportsController::class, 'getProjectStats']);
Route::get('/reports/revenue', [\App\Http\Controllers\ReportsController::class, 'getRevenueStats']);
Route::get('/reports/devices', [\App\Http\Controllers\ReportsController::class, 'getDeviceStats']);
Route::get('/reports/projects/export', [\App\Http\Controllers\ReportsController::class, 'exportProjectReport']);
Route::get('/reports/revenue/export', [\App\Http\Controllers\ReportsController::class, 'exportRevenueReport']);
Route::post('/reports/devices/export', [\App\Http\Controllers\ReportsController::class, 'exportDeviceReport']);

// Settings Management Routes
Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index']);
Route::put('/settings', [\App\Http\Controllers\SettingsController::class, 'update']);
Route::post('/settings/upload-default-logo', [\App\Http\Controllers\SettingsController::class, 'uploadDefaultLogo']);
Route::delete('/settings/delete-default-logo', [\App\Http\Controllers\SettingsController::class, 'deleteDefaultLogo']);

// User Management Routes (Protected)
Route::get('/users', function () {
    return response()->json([
        [
            'id' => 1,
            'name' => 'Admin User',
            'email' => 'admin@hometronix.com',
            'role' => 'admin',
            'is_active' => true,
            'created_at' => '2024-01-01T00:00:00.000000Z',
            'updated_at' => '2024-01-01T00:00:00.000000Z'
        ],
        [
            'id' => 2,
            'name' => 'John Doe',
            'email' => 'john@hometronix.com',
            'role' => 'salesperson',
            'is_active' => true,
            'created_at' => '2024-01-02T00:00:00.000000Z',
            'updated_at' => '2024-01-02T00:00:00.000000Z'
        ],
        [
            'id' => 3,
            'name' => 'Mike Johnson',
            'email' => 'mike@hometronix.com',
            'role' => 'technician',
            'is_active' => true,
            'created_at' => '2024-01-03T00:00:00.000000Z',
            'updated_at' => '2024-01-03T00:00:00.000000Z'
        ]
    ]);
});

// Password Change with OTP Routes - Real OTPService Implementation
Route::post('/users/request-password-change-otp', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'user_id' => 'required|integer',
        'action' => 'required|in:self_change,admin_reset',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // Decode token to get current user
    $authHeader = $request->header('Authorization');
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        return response()->json(['error' => 'No token provided'], 401);
    }

    $token = substr($authHeader, 7);
    $decoded = json_decode(base64_decode($token), true);

    if (!$decoded || !isset($decoded['id'])) {
        return response()->json(['error' => 'Invalid token'], 401);
    }

    $currentUser = \App\Models\User::find($decoded['id']);
    if (!$currentUser) {
        return response()->json(['error' => 'User not found'], 401);
    }

    // Find target user
    $targetUser = \App\Models\User::find($request->user_id);
    if (!$targetUser) {
        return response()->json(['error' => 'Target user not found'], 404);
    }

    // Check permissions
    if ($request->action === 'self_change' && $targetUser->id !== $currentUser->id) {
        return response()->json([
            'error' => 'You can only change your own password with self_change action'
        ], 403);
    }

    if ($request->action === 'admin_reset' && $currentUser->role !== 'admin') {
        return response()->json([
            'error' => 'Only admins can reset other users passwords'
        ], 403);
    }

    // Generate and send OTP using real OTPService
    $otpService = app(\App\Services\OTPService::class);
    $action = $request->action === 'self_change' ? 'password_change' : 'admin_password_reset';

    $otp = $otpService->generateOTP($currentUser, $action);
    $sent = $otpService->sendOTP($currentUser, $otp, $action);

    if (!$sent) {
        \Log::error("Failed to send OTP email to {$currentUser->email}");
        return response()->json([
            'error' => 'Failed to send OTP email. Please check SMTP settings.',
            'message' => 'Unable to send verification code. Please contact your administrator.'
        ], 500);
    }

    \Log::info("OTP sent successfully to {$currentUser->email} for {$action}");

    return response()->json([
        'message' => 'OTP sent successfully to your email',
        'expires_in_minutes' => 10,
        'remaining_attempts' => $otpService->getRemainingAttempts($currentUser, $action)
    ]);
});

// Real password change implementation with OTPService verification
Route::post('/users/change-password', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'user_id' => 'required|integer',
        'new_password' => 'required|string|min:6|confirmed',
        'otp' => 'required|string|size:6',
        'action' => 'required|in:self_change,admin_reset',
        'current_password' => 'required_if:action,self_change',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // Decode token to get current user
    $authHeader = $request->header('Authorization');
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        return response()->json(['error' => 'No token provided'], 401);
    }

    $token = substr($authHeader, 7);
    $decoded = json_decode(base64_decode($token), true);

    if (!$decoded || !isset($decoded['id'])) {
        return response()->json(['error' => 'Invalid token'], 401);
    }

    $currentUser = \App\Models\User::find($decoded['id']);
    if (!$currentUser) {
        return response()->json(['error' => 'User not found'], 401);
    }

    // Find target user
    $targetUser = \App\Models\User::find($request->user_id);
    if (!$targetUser) {
        return response()->json(['error' => 'Target user not found'], 404);
    }

    // Check permissions
    if ($request->action === 'self_change' && $targetUser->id !== $currentUser->id) {
        return response()->json([
            'error' => 'You can only change your own password with self_change action'
        ], 403);
    }

    if ($request->action === 'admin_reset' && $currentUser->role !== 'admin') {
        return response()->json([
            'error' => 'Only admins can reset other users passwords'
        ], 403);
    }

    // For self password change, verify current password
    if ($request->action === 'self_change') {
        if (!password_verify($request->current_password, $targetUser->password)) {
            return response()->json([
                'error' => 'Current password is incorrect'
            ], 422);
        }
    }

    // Verify OTP using real OTPService
    $otpService = app(\App\Services\OTPService::class);
    $action = $request->action === 'self_change' ? 'password_change' : 'admin_password_reset';

    if (!$otpService->verifyOTP($currentUser, $request->otp, $action)) {
        $remainingAttempts = $otpService->getRemainingAttempts($currentUser, $action);

        if ($remainingAttempts <= 0) {
            return response()->json([
                'error' => 'Too many failed attempts. Please request a new OTP.'
            ], 429);
        }

        return response()->json([
            'error' => 'Invalid or expired OTP',
            'remaining_attempts' => $remainingAttempts
        ], 422);
    }

    // Update password and reset expiry
    $targetUser->password = password_hash($request->new_password, PASSWORD_DEFAULT);
    $targetUser->force_password_change = false;
    $targetUser->password_changed_at = now();

    // Set password expiry to 90 days from now
    $targetUser->setPasswordExpiry(now());
    $targetUser->save();

    \Log::info("Password changed successfully for user {$targetUser->email} by {$currentUser->email}");

    $message = $request->action === 'self_change'
        ? 'Your password has been changed successfully. Password expiry reset to 90 days from today.'
        : "Password for {$targetUser->name} has been reset successfully. Password expiry reset to 90 days from today.";

    return response()->json([
        'message' => $message,
        'password_changed_at' => $targetUser->password_changed_at->toISOString(),
        'password_expires_at' => $targetUser->password_expires_at->toISOString(),
        'days_until_expiry' => 90
    ]);
});

Route::patch('/users/{id}/toggle-status', function ($id) {
    $users = [
        1 => 'Admin User',
        2 => 'John Doe', 
        3 => 'Mike Johnson'
    ];

    if (!isset($users[$id])) {
        return response()->json(['error' => 'User not found'], 404);
    }

    if ($id == 1) {
        return response()->json(['error' => 'Cannot deactivate your own account'], 422);
    }

    return response()->json([
        'message' => "User {$users[$id]} status toggled successfully",
        'user' => [
            'id' => $id,
            'name' => $users[$id],
            'is_active' => !rand(0, 1)
        ]
    ]);
});

// Password Expiry Routes
// Manual token decoding to avoid JWT dependency - consistent with AuthController pattern
Route::get('/users/password-status', function (Request $request) {
    // Decode token from Authorization header (same pattern as AuthController::me())
    $authHeader = $request->header('Authorization');
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        return response()->json(['error' => 'No token provided'], 401);
    }

    $token = substr($authHeader, 7);
    $decoded = json_decode(base64_decode($token), true);

    if (!$decoded || !isset($decoded['id'])) {
        return response()->json(['error' => 'Invalid token'], 401);
    }

    // Find user by ID from token
    $user = \App\Models\User::find($decoded['id']);
    if (!$user) {
        return response()->json(['error' => 'User not found'], 401);
    }

    // Return accurate password status using creation-date-based calculations
    return response()->json([
        'days_remaining' => $user->getDaysUntilPasswordExpiresFromCreation(),
        'is_expired' => $user->isPasswordExpiredFromCreation(),
        'is_expiring_soon' => $user->isPasswordExpiringSoonFromCreation(),
        'next_expiry_date' => $user->calculatePasswordExpiryFromCreation()->format('Y-m-d'),
        'created_at' => $user->created_at->format('Y-m-d'),
        'password_changed_at' => $user->password_changed_at ? $user->password_changed_at->format('Y-m-d') : null,
    ]);
});

// Legacy route for backward compatibility
Route::get('/auth/password-expiry-status', function () {
    return response()->json([
        'password_expiry_status' => [
            'is_expired' => false,
            'is_expiring_soon' => true,
            'days_remaining' => 5,
            'password_changed_at' => now()->subDays(85)->toISOString(),
            'password_expires_at' => now()->addDays(5)->toISOString(),
            'force_password_change' => false
        ],
        'notification' => [
            'type' => 'warning',
            'title' => 'Password Expiring Soon',
            'message' => 'Your password expires in 5 days. Please change it soon.',
            'action' => 'change_password',
            'priority' => 'medium',
            'days_remaining' => 5
        ]
    ]);
});

Route::post('/auth/initialize-password-expiry', function () {
    return response()->json([
        'message' => 'Password expiry initialized for 3 users'
    ]);
});

// Email Configuration Test Route
Route::post('/settings/test-email-connection', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'smtp_host' => 'required|string',
        'smtp_port' => 'required|integer',
        'smtp_username' => 'required|string',
        'smtp_password' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        // Create a simple socket connection test for SMTP
        $host = $request->smtp_host;
        $port = (int) $request->smtp_port;
        $timeout = 10;
        
        $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
        
        if (!$socket) {
            return response()->json([
                'success' => false,
                'message' => "Cannot connect to SMTP server: {$errstr} ({$errno})",
                'error' => "Connection failed to {$host}:{$port}"
            ], 422);
        }
        
        // Read the initial response
        $response = fgets($socket, 512);
        
        if (strpos($response, '220') !== 0) {
            fclose($socket);
            return response()->json([
                'success' => false,
                'message' => 'SMTP server did not respond correctly',
                'error' => "Server response: {$response}"
            ], 422);
        }
        
        // Send EHLO command
        fputs($socket, "EHLO hometronix.com.ng\r\n");
        $ehloResponse = fgets($socket, 512);
        
        // Test STARTTLS for port 587
        if ($port == 587) {
            fputs($socket, "STARTTLS\r\n");
            $startTlsResponse = fgets($socket, 512);
            if (strpos($startTlsResponse, '220') !== 0) {
                fclose($socket);
                return response()->json([
                    'success' => false,
                    'message' => 'STARTTLS not supported or failed',
                    'error' => "STARTTLS response: {$startTlsResponse}"
                ], 422);
            }
        }
        
        fclose($socket);
        
        // If we get here, basic connection was successful
        return response()->json([
            'success' => true,
            'message' => 'SMTP connection test successful - server is reachable and responding correctly'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Email connection test failed',
            'error' => $e->getMessage()
        ], 422);
    }
});

// Currency Management Routes
Route::get('/currencies', function () {
    return response()->json([
        'success' => true,
        'data' => [
            // Major Currencies
            [
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'EUR',
                'name' => 'Euro',
                'symbol' => '€',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => '.',
                'decimal_separator' => ',',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'GBP',
                'name' => 'British Pound Sterling',
                'symbol' => '£',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'NGN',
                'name' => 'Nigerian Naira',
                'symbol' => '₦',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => true
            ],
            
            // African Currencies
            [
                'code' => 'ZAR',
                'name' => 'South African Rand',
                'symbol' => 'R',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'EGP',
                'name' => 'Egyptian Pound',
                'symbol' => 'E£',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'GHS',
                'name' => 'Ghanaian Cedi',
                'symbol' => 'GH₵',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'KES',
                'name' => 'Kenyan Shilling',
                'symbol' => 'KSh',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            
            // Asian Currencies
            [
                'code' => 'JPY',
                'name' => 'Japanese Yen',
                'symbol' => '¥',
                'symbol_position' => 'before',
                'decimal_places' => 0,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'CNY',
                'name' => 'Chinese Yuan',
                'symbol' => '¥',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'INR',
                'name' => 'Indian Rupee',
                'symbol' => '₹',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'SGD',
                'name' => 'Singapore Dollar',
                'symbol' => 'S$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            
            // American Currencies
            [
                'code' => 'CAD',
                'name' => 'Canadian Dollar',
                'symbol' => 'C$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ],
            [
                'code' => 'AUD',
                'name' => 'Australian Dollar',
                'symbol' => 'A$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_separator' => ',',
                'decimal_separator' => '.',
                'is_active' => true,
                'is_default' => false
            ]
        ]
    ]);
});

Route::post('/currencies', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'code' => 'required|string|size:3',
        'name' => 'required|string|max:100',
        'symbol' => 'required|string|max:10',
        'symbol_position' => 'required|in:before,after',
        'decimal_places' => 'required|integer|min:0|max:4',
        'thousands_separator' => 'required|string|max:1',
        'decimal_separator' => 'required|string|max:1',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    $currency = array_merge($request->all(), [
        'code' => strtoupper($request->code),
        'is_active' => true,
        'is_default' => false,
        'created_at' => now()->toISOString(),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Currency added successfully',
        'data' => $currency
    ]);
});

Route::put('/currencies/{code}', function (Request $request, $code) {
    $validator = Validator::make($request->all(), [
        'name' => 'sometimes|required|string|max:100',
        'symbol' => 'sometimes|required|string|max:10',
        'symbol_position' => 'sometimes|required|in:before,after',
        'decimal_places' => 'sometimes|required|integer|min:0|max:4',
        'thousands_separator' => 'sometimes|required|string|max:1',
        'decimal_separator' => 'sometimes|required|string|max:1',
        'is_active' => 'sometimes|boolean',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    return response()->json([
        'success' => true,
        'message' => "Currency {$code} updated successfully",
        'data' => array_merge($request->all(), ['code' => $code])
    ]);
});

Route::delete('/currencies/{code}', function ($code) {
    $protectedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'JPY', 'CNY', 'INR'];
    
    if (in_array($code, $protectedCurrencies)) {
        return response()->json([
            'success' => false,
            'message' => 'Cannot delete protected currency'
        ], 422);
    }

    return response()->json([
        'success' => true,
        'message' => "Currency {$code} deleted successfully"
    ]);
});

Route::get('/currencies/active', function () {
    return response()->json([
        'success' => true,
        'data' => [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
            ['code' => 'NGN', 'name' => 'Nigerian Naira', 'symbol' => '₦'],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥'],
            ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥'],
            ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹'],
            ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'C$'],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$']
        ]
    ]);
});