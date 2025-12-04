<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use Carbon\Carbon;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            ['name' => 'Ikoyi Smart Home Installation', 'description' => 'Complete smart home automation for luxury apartment', 'client_id' => 1, 'salesperson_id' => 1, 'status' => 'active', 'start_date' => Carbon::now()->subDays(10), 'total_cost' => 1250000, 'labor_cost' => 250000, 'material_cost' => 950000, 'tax_amount' => 50000],
            ['name' => 'Kaduna Security System Upgrade', 'description' => 'Advanced security camera and alarm system', 'client_id' => 2, 'salesperson_id' => 2, 'status' => 'active', 'start_date' => Carbon::now()->subDays(5), 'total_cost' => 850000, 'labor_cost' => 150000, 'material_cost' => 650000, 'tax_amount' => 50000],
            ['name' => 'Victoria Island Lighting Project', 'description' => 'Smart lighting control throughout the building', 'client_id' => 3, 'salesperson_id' => 1, 'status' => 'completed', 'start_date' => Carbon::now()->subDays(30), 'end_date' => Carbon::now()->subDays(2), 'total_cost' => 650000, 'labor_cost' => 100000, 'material_cost' => 520000, 'tax_amount' => 30000],
            ['name' => 'Port Harcourt Commercial Property', 'description' => 'Full building automation for office complex', 'client_id' => 4, 'salesperson_id' => 2, 'status' => 'active', 'start_date' => Carbon::now()->subDays(15), 'total_cost' => 2500000, 'labor_cost' => 500000, 'material_cost' => 1900000, 'tax_amount' => 100000],
            ['name' => 'Abuja Government Building', 'description' => 'Security and access control system', 'client_id' => 5, 'salesperson_id' => 1, 'status' => 'pending', 'start_date' => null, 'total_cost' => 3200000, 'labor_cost' => 600000, 'material_cost' => 2500000, 'tax_amount' => 100000],
            ['name' => 'Lagos Villa Smart Upgrade', 'description' => 'HVAC and climate control automation', 'client_id' => 1, 'salesperson_id' => 2, 'status' => 'completed', 'start_date' => Carbon::now()->subDays(60), 'end_date' => Carbon::now()->subDays(30), 'total_cost' => 980000, 'labor_cost' => 180000, 'material_cost' => 760000, 'tax_amount' => 40000],
            ['name' => 'Kaduna Residential Complex', 'description' => 'Multi-unit smart home system', 'client_id' => 2, 'salesperson_id' => 1, 'status' => 'active', 'start_date' => Carbon::now()->subDays(8), 'total_cost' => 1750000, 'labor_cost' => 350000, 'material_cost' => 1330000, 'tax_amount' => 70000],
            ['name' => 'Lekki Smart Office', 'description' => 'Office automation and energy management', 'client_id' => 3, 'salesperson_id' => 2, 'status' => 'pending', 'start_date' => null, 'total_cost' => 1450000, 'labor_cost' => 250000, 'material_cost' => 1150000, 'tax_amount' => 50000],
            ['name' => 'Port Harcourt Warehouse Security', 'description' => 'Perimeter security and monitoring', 'client_id' => 4, 'salesperson_id' => 1, 'status' => 'completed', 'start_date' => Carbon::now()->subDays(45), 'end_date' => Carbon::now()->subDays(10), 'total_cost' => 720000, 'labor_cost' => 120000, 'material_cost' => 570000, 'tax_amount' => 30000],
            ['name' => 'Abuja Smart Campus', 'description' => 'University campus automation project', 'client_id' => 5, 'salesperson_id' => 2, 'status' => 'active', 'start_date' => Carbon::now()->subDays(20), 'total_cost' => 4500000, 'labor_cost' => 900000, 'material_cost' => 3420000, 'tax_amount' => 180000],
        ];

        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}
