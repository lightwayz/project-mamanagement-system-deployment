<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProposalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $proposals = [
            ['project_id' => 1, 'title' => 'Ikoyi Smart Home - Complete Automation Package', 'description' => 'Comprehensive proposal for full home automation including lighting, security, HVAC, and entertainment systems', 'amount' => 1250000, 'status' => 'approved', 'submitted_date' => '2024-09-28', 'approved_date' => '2024-10-01'],
            ['project_id' => 2, 'title' => 'Kaduna Security System - Phase 1', 'description' => 'Initial security upgrade proposal covering perimeter cameras and alarm systems', 'amount' => 850000, 'status' => 'approved', 'submitted_date' => '2024-10-02', 'approved_date' => '2024-10-03'],
            ['project_id' => 4, 'title' => 'Port Harcourt Commercial - Building Automation', 'description' => 'Full building automation system for office complex with energy management', 'amount' => 2500000, 'status' => 'approved', 'submitted_date' => '2024-09-23', 'approved_date' => '2024-09-25'],
            ['project_id' => 5, 'title' => 'Abuja Government Building - Security Access Control', 'description' => 'Government-grade security and access control system with biometric integration', 'amount' => 3200000, 'status' => 'pending', 'submitted_date' => '2024-10-05', 'approved_date' => null],
            ['project_id' => 8, 'title' => 'Lekki Smart Office - Energy Management System', 'description' => 'Office automation proposal with focus on energy efficiency and smart scheduling', 'amount' => 1450000, 'status' => 'pending', 'submitted_date' => '2024-10-06', 'approved_date' => null],
            ['project_id' => 3, 'title' => 'Victoria Island Lighting - Extension Proposal', 'description' => 'Additional lighting zones and outdoor smart lighting integration', 'amount' => 320000, 'status' => 'rejected', 'submitted_date' => '2024-09-15', 'approved_date' => null],
        ];

        foreach ($proposals as $proposal) {
            \App\Models\Proposal::create($proposal);
        }
    }
}
