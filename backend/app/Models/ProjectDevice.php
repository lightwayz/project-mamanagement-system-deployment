<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_location_id',
        'device_id',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project location that owns the device association
     */
    public function location()
    {
        return $this->belongsTo(ProjectLocation::class, 'project_location_id');
    }

    /**
     * Get the device associated with this project
     */
    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Get the project through the location relationship
     */
    public function project()
    {
        return $this->hasOneThrough(Project::class, ProjectLocation::class, 'id', 'id', 'project_location_id', 'project_id');
    }

    /**
     * Boot the model to handle automatic total_price calculation
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($projectDevice) {
            $projectDevice->total_price = $projectDevice->quantity * $projectDevice->unit_price;
        });
    }

    /**
     * Calculate the profit for this device (selling price vs cost price)
     */
    public function getProfit()
    {
        if ($this->device) {
            $costPrice = $this->device->cost_price * $this->quantity;
            $sellingPrice = $this->total_price;
            return $sellingPrice - $costPrice;
        }
        return 0;
    }

    /**
     * Calculate the profit margin percentage
     */
    public function getProfitMargin()
    {
        if ($this->device && $this->total_price > 0) {
            $profit = $this->getProfit();
            return ($profit / $this->total_price) * 100;
        }
        return 0;
    }

    /**
     * Check if the unit price is different from device selling price
     */
    public function hasPriceOverride()
    {
        if ($this->device) {
            return $this->unit_price != $this->device->selling_price;
        }
        return false;
    }
}