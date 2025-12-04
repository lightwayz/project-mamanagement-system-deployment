<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'company_address',
        'company_phone',
        'company_email',
        'currency',
        'tax_rate',
        'default_company_logo_path',
        'contract_terms',
    ];

    protected $casts = [
        'tax_rate' => 'decimal:2',
    ];

    /**
     * Get the singleton settings instance
     * Creates one if it doesn't exist
     */
    public static function getInstance(): self
    {
        $settings = self::first();

        if (!$settings) {
            $settings = self::create([
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

        return $settings;
    }

    /**
     * Update settings values
     */
    public function updateSettings(array $data): bool
    {
        return $this->update($data);
    }
}
