<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index()
    {
        try {
            if (Schema::hasTable('settings')) {
                $settings = Setting::first();
            } else {
                $settings = null;
            }

            return response()->json([
                'company_name'      => $settings->company_name      ?? 'Hometronix',
                'default_currency'  => $settings->default_currency  ?? 'NGN',
                'currency_symbol'   => $settings->currency_symbol   ?? '₦',
                'tax_rate'          => $settings->tax_rate          ?? 0,
                'logo_url'          => $settings->logo_url          ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::error('Settings index error: '.$e->getMessage());

            // Return safe defaults instead of 500
            return response()->json([
                'company_name'      => 'Hometronix',
                'default_currency'  => 'NGN',
                'currency_symbol'   => '₦',
                'tax_rate'          => 0,
                'logo_url'          => null,
            ]);
        }
    }

    public function update(Request $request)
    {
        // You can wire this to DB later; for now just accept and return success
        return response()->json([
            'message' => 'Settings saved (stub)',
            'data'    => $request->all(),
        ]);
    }

    public function uploadDefaultLogo(Request $request)
    {
        return response()->json([
            'message' => 'Logo upload stub – implement later',
        ]);
    }

    public function deleteDefaultLogo()
    {
        return response()->json([
            'message' => 'Logo delete stub – implement later',
        ]);
    }
}
