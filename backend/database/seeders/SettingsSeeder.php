<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if settings already exist
        $existingSettings = \App\Models\Setting::first();

        if (!$existingSettings) {
            \App\Models\Setting::create([
                'company_name' => 'Hometronix Nigeria Limited',
                'company_address' => '',
                'company_phone' => '',
                'company_email' => '',
                'currency' => '₦',
                'tax_rate' => 7.50,
                'default_company_logo_path' => null,
                'contract_terms' => null,
            ]);

            $this->command->info('Default settings created successfully!');
        } else {
            $this->command->info('Settings already exist. Skipping seeder.');
        }
    }
}
