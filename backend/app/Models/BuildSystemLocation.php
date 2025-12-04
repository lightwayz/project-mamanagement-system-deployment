<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuildSystemLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'build_system_id',
        'parent_location_id',
        'level',
        'name',
        'description'
    ];

    /**
     * Get the build system this location belongs to
     */
    public function buildSystem(): BelongsTo
    {
        return $this->belongsTo(BuildSystem::class);
    }

    /**
     * Get the parent location (for sub-locations)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(BuildSystemLocation::class, 'parent_location_id');
    }

    /**
     * Get all child sub-locations
     */
    public function subLocations(): HasMany
    {
        return $this->hasMany(BuildSystemLocation::class, 'parent_location_id');
    }

    /**
     * Get all devices assigned to this location
     */
    public function devices(): HasMany
    {
        return $this->hasMany(BuildSystemDevice::class);
    }

    /**
     * Check if this is a sub-location
     */
    public function isSubLocation(): bool
    {
        return $this->parent_location_id !== null;
    }

    /**
     * Check if this is a main location
     */
    public function isMainLocation(): bool
    {
        return $this->parent_location_id === null;
    }

    /**
     * Get all main locations (level 0) for a build system
     */
    public static function mainLocations($buildSystemId)
    {
        return static::where('build_system_id', $buildSystemId)
                    ->whereNull('parent_location_id')
                    ->orderBy('name')
                    ->get();
    }

    /**
     * Get the total cost of all devices in this location
     */
    public function getTotalCostAttribute(): float
    {
        return $this->devices->sum('total_price');
    }

    /**
     * Get the total cost including sub-locations
     */
    public function getTotalCostWithSubLocationsAttribute(): float
    {
        $cost = $this->devices->sum('total_price');

        // Add cost from sub-locations
        foreach ($this->subLocations as $subLocation) {
            $cost += $subLocation->total_cost_with_sub_locations;
        }

        return $cost;
    }

    /**
     * Get the total number of devices in this location
     */
    public function getTotalDevicesAttribute(): int
    {
        return $this->devices->sum('quantity');
    }

    /**
     * Get the total number of devices including sub-locations
     */
    public function getTotalDevicesWithSubLocationsAttribute(): int
    {
        $count = $this->devices->sum('quantity');

        // Add devices from sub-locations
        foreach ($this->subLocations as $subLocation) {
            $count += $subLocation->total_devices_with_sub_locations;
        }

        return $count;
    }

    /**
     * Get the full path name (e.g., "Living Room > TV Area")
     */
    public function getFullPathAttribute(): string
    {
        if ($this->isMainLocation()) {
            return $this->name;
        }

        return $this->parent->full_path . ' > ' . $this->name;
    }

    /**
     * Delete this location and update the build system total cost
     */
    public function delete()
    {
        $buildSystem = $this->buildSystem;
        $result = parent::delete();

        if ($result && $buildSystem) {
            $buildSystem->calculateTotalCost();
        }

        return $result;
    }
}
