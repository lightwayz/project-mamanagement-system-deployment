<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuildSystemDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'build_system_location_id',
        'device_id',
        'quantity',
        'unit_price',
        'total_price'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    /**
     * Get the location this device assignment belongs to
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(BuildSystemLocation::class, 'build_system_location_id');
    }

    /**
     * Get the device details
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Automatically calculate total price when saving
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            $model->total_price = $model->quantity * $model->unit_price;
        });

        static::saved(function ($model) {
            if ($model->location && $model->location->buildSystem) {
                $model->location->buildSystem->calculateTotalCost();
            }
        });

        static::deleted(function ($model) {
            if ($model->location && $model->location->buildSystem) {
                $model->location->buildSystem->calculateTotalCost();
            }
        });
    }

    /**
     * Set the unit price and recalculate total
     */
    public function setUnitPriceAttribute($value)
    {
        $this->attributes['unit_price'] = $value;
        $this->attributes['total_price'] = $this->quantity * $value;
    }

    /**
     * Set the quantity and recalculate total
     */
    public function setQuantityAttribute($value)
    {
        $this->attributes['quantity'] = $value;
        $this->attributes['total_price'] = $value * $this->unit_price;
    }
}
