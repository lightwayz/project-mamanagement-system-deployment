<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        try {
            // Get or create settings instance (singleton pattern)
            $settings = Setting::getInstance();

            return response()->json($settings);
        } catch (Exception $e) {
            Log::error('Failed to load settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return default settings as fallback
            return response()->json([
                'company_name' => 'Hometronix Nigeria Limited',
                'company_address' => '',
                'company_phone' => '',
                'company_email' => '',
                'currency' => '₦',
                'tax_rate' => 7.50,
                'default_company_logo_path' => null,
                'contract_terms' => null,
            ]);
        }
    }

    /**
     * Update settings
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_name' => 'nullable|string|max:255',
                'company_address' => 'nullable|string',
                'company_phone' => 'nullable|string|max:50',
                'company_email' => 'nullable|email|max:255',
                'currency' => 'nullable|string|max:10',
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'contract_terms' => 'nullable|string',
                'default_company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get or create settings instance
            $settings = Setting::getInstance();

            // Update fields
            $updateData = [];

            if ($request->has('company_name')) {
                $updateData['company_name'] = $request->company_name;
            }
            if ($request->has('company_address')) {
                $updateData['company_address'] = $request->company_address;
            }
            if ($request->has('company_phone')) {
                $updateData['company_phone'] = $request->company_phone;
            }
            if ($request->has('company_email')) {
                $updateData['company_email'] = $request->company_email;
            }
            if ($request->has('currency')) {
                $updateData['currency'] = $request->currency;
            }
            if ($request->has('tax_rate')) {
                $updateData['tax_rate'] = $request->tax_rate;
            }
            if ($request->has('contract_terms')) {
                $updateData['contract_terms'] = $request->contract_terms;
            }

            // Handle default company logo upload
            if ($request->hasFile('default_company_logo')) {
                // Delete old logo if exists
                if ($settings->default_company_logo_path && Storage::disk('public')->exists($settings->default_company_logo_path)) {
                    Storage::disk('public')->delete($settings->default_company_logo_path);
                }

                // Store new logo
                $path = $request->file('default_company_logo')->store('logos/company', 'public');
                $updateData['default_company_logo_path'] = $path;
            }

            $settings->update($updateData);

            return response()->json([
                'message' => 'Settings updated successfully',
                'data' => $settings->fresh()
            ]);
        } catch (Exception $e) {
            Log::error('Failed to update settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to update settings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload default company logo separately
     */
    public function uploadDefaultLogo(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get or create settings instance
            $settings = Setting::getInstance();

            // Delete old logo if exists
            if ($settings->default_company_logo_path && Storage::disk('public')->exists($settings->default_company_logo_path)) {
                Storage::disk('public')->delete($settings->default_company_logo_path);
            }

            // Store new logo
            $path = $request->file('logo')->store('logos/company', 'public');
            $settings->update(['default_company_logo_path' => $path]);

            return response()->json([
                'message' => 'Default company logo uploaded successfully',
                'logo_path' => $path,
                'logo_url' => Storage::disk('public')->url($path)
            ]);
        } catch (Exception $e) {
            Log::error('Failed to upload logo', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to upload logo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete default company logo
     */
    public function deleteDefaultLogo(): JsonResponse
    {
        try {
            $settings = Setting::getInstance();

            if (!$settings->default_company_logo_path) {
                return response()->json([
                    'error' => 'No default company logo found'
                ], 404);
            }

            // Delete the file
            if (Storage::disk('public')->exists($settings->default_company_logo_path)) {
                Storage::disk('public')->delete($settings->default_company_logo_path);
            }

            // Update settings
            $settings->update(['default_company_logo_path' => null]);

            return response()->json([
                'message' => 'Default company logo deleted successfully'
            ]);
        } catch (Exception $e) {
            Log::error('Failed to delete logo', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to delete logo',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
