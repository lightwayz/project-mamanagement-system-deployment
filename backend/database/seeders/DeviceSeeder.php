<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Device;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $devices = [
            ['name' => 'Smart LED Bulb A19', 'category' => 'lighting', 'brand' => 'Philips', 'model' => 'Hue A19', 'cost_price' => 2500, 'selling_price' => 4500, 'supplier' => 'Philips Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Wireless Security Camera', 'category' => 'security', 'brand' => 'Ring', 'model' => 'Stick Up Cam', 'cost_price' => 15000, 'selling_price' => 25000, 'supplier' => 'Amazon Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Thermostat', 'category' => 'hvac', 'brand' => 'Nest', 'model' => 'Learning 3rd Gen', 'cost_price' => 35000, 'selling_price' => 55000, 'supplier' => 'Google Store', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Door Lock Smart', 'category' => 'security', 'brand' => 'August', 'model' => 'Smart Lock Pro', 'cost_price' => 28000, 'selling_price' => 45000, 'supplier' => 'August Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Motion Sensor PIR', 'category' => 'security', 'brand' => 'SmartThings', 'model' => 'Motion V5', 'cost_price' => 3500, 'selling_price' => 6500, 'supplier' => 'Samsung Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Switch 2-Gang', 'category' => 'lighting', 'brand' => 'TP-Link', 'model' => 'Kasa HS220', 'cost_price' => 5500, 'selling_price' => 9500, 'supplier' => 'TP-Link Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Video Doorbell Pro', 'category' => 'security', 'brand' => 'Ring', 'model' => 'Pro 2', 'cost_price' => 32000, 'selling_price' => 52000, 'supplier' => 'Amazon Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Plug Mini', 'category' => 'automation', 'brand' => 'TP-Link', 'model' => 'Kasa EP10', 'cost_price' => 1800, 'selling_price' => 3500, 'supplier' => 'TP-Link Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'LED Strip 5M RGB', 'category' => 'lighting', 'brand' => 'Philips', 'model' => 'Hue Strip Plus', 'cost_price' => 12000, 'selling_price' => 20000, 'supplier' => 'Philips Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Hub Controller', 'category' => 'automation', 'brand' => 'Samsung', 'model' => 'SmartThings V3', 'cost_price' => 18000, 'selling_price' => 30000, 'supplier' => 'Samsung Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Window/Door Sensor', 'category' => 'security', 'brand' => 'SmartThings', 'model' => 'Multipurpose V6', 'cost_price' => 4200, 'selling_price' => 7500, 'supplier' => 'Samsung Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Speaker', 'category' => 'audio', 'brand' => 'Amazon', 'model' => 'Echo Dot 4th', 'cost_price' => 8500, 'selling_price' => 15000, 'supplier' => 'Amazon Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'IP Camera 4K', 'category' => 'security', 'brand' => 'Arlo', 'model' => 'Ultra 2', 'cost_price' => 45000, 'selling_price' => 75000, 'supplier' => 'Arlo Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Blind Motor', 'category' => 'automation', 'brand' => 'Soma', 'model' => 'Smart Shades', 'cost_price' => 22000, 'selling_price' => 38000, 'supplier' => 'Soma Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smoke Detector Smart', 'category' => 'safety', 'brand' => 'Nest', 'model' => 'Protect 2nd Gen', 'cost_price' => 16000, 'selling_price' => 28000, 'supplier' => 'Google Store', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Garage Opener', 'category' => 'automation', 'brand' => 'Chamberlain', 'model' => 'MyQ', 'cost_price' => 19500, 'selling_price' => 32000, 'supplier' => 'Chamberlain Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Water Leak Sensor', 'category' => 'safety', 'brand' => 'SmartThings', 'model' => 'Water Leak V4', 'cost_price' => 5800, 'selling_price' => 10000, 'supplier' => 'Samsung Nigeria', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Smart Display 10"', 'category' => 'audio', 'brand' => 'Google', 'model' => 'Nest Hub Max', 'cost_price' => 28000, 'selling_price' => 48000, 'supplier' => 'Google Store', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Outdoor Camera Solar', 'category' => 'security', 'brand' => 'Ring', 'model' => 'Spotlight Cam', 'cost_price' => 25000, 'selling_price' => 42000, 'supplier' => 'Amazon Direct', 'is_taxable' => true, 'is_active' => true],
            ['name' => 'Dimmer Switch Smart', 'category' => 'lighting', 'brand' => 'Lutron', 'model' => 'Caseta Wireless', 'cost_price' => 7500, 'selling_price' => 13000, 'supplier' => 'Lutron Nigeria', 'is_taxable' => true, 'is_active' => true],
        ];

        foreach ($devices as $device) {
            Device::create($device);
        }
    }
}
