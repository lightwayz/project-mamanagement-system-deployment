<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuildSystem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'total_cost',
        'created_by',
        'is_active'
    ];

    protected $casts = [
        'total_cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created this build system
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all locations for this build system
     */
    public function locations(): HasMany
    {
        return $this->hasMany(BuildSystemLocation::class);
    }

    /**
     * Calculate and update the total cost based on all devices
     */
    public function calculateTotalCost(): void
    {
        $totalCost = $this->locations()
            ->with('devices')
            ->get()
            ->sum(function ($location) {
                return $location->devices->sum('total_price');
            });

        $this->update(['total_cost' => $totalCost]);
    }

    /**
     * Get the total number of devices in this build system
     */
    public function getTotalDevicesAttribute(): int
    {
        return $this->locations()
            ->withCount('devices')
            ->get()
            ->sum('devices_count');
    }

    /**
     * Scope to filter by active systems
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by creator
     */
    public function scopeByCreator($query, $userId)
    {
        return $query->where('created_by', $userId);
    }
}
