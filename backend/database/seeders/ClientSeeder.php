<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            ['name' => 'Chukwudi Okafor', 'email' => 'c.okafor@gmail.com', 'phone' => '+234 803 456 7890', 'address' => '15 Awolowo Road, Ikoyi, Lagos', 'company' => 'Okafor Holdings Ltd', 'notes' => 'Preferred contractor for home automation'],
            ['name' => 'Aisha Mohammed', 'email' => 'aisha.m@yahoo.com', 'phone' => '+234 805 123 4567', 'address' => '7 Independence Way, Kaduna', 'company' => 'AM Enterprises', 'notes' => 'Interested in smart security systems'],
            ['name' => 'Oluwaseun Adebayo', 'email' => 'seun.adebayo@outlook.com', 'phone' => '+234 807 890 1234', 'address' => '22 Victoria Island, Lagos', 'company' => null, 'notes' => 'Residential client - luxury apartment'],
            ['name' => 'Ngozi Eze', 'email' => 'ngozi.eze@gmail.com', 'phone' => '+234 806 345 6789', 'address' => '10 Trans-Amadi, Port Harcourt', 'company' => 'Eze Properties Ltd', 'notes' => 'Commercial property developer'],
            ['name' => 'Ibrahim Yusuf', 'email' => 'i.yusuf@email.com', 'phone' => '+234 809 234 5678', 'address' => '5 Ahmadu Bello Way, Abuja', 'company' => 'Yusuf Ventures', 'notes' => 'Government contracts specialist'],
        ];

        foreach ($clients as $client) {
            Client::create($client);
        }
    }
}
