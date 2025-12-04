<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'parent_location_id',
        'level',
        'name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project that owns the location
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the parent location (for sub-locations)
     */
    public function parent()
    {
        return $this->belongsTo(ProjectLocation::class, 'parent_location_id');
    }

    /**
     * Get all child sub-locations
     */
    public function subLocations()
    {
        return $this->hasMany(ProjectLocation::class, 'parent_location_id');
    }

    /**
     * Get the devices associated with this location
     */
    public function devices()
    {
        return $this->hasMany(ProjectDevice::class);
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
     * Get all main locations (level 0) for a project
     */
    public static function mainLocations($projectId)
    {
        return static::where('project_id', $projectId)
                    ->whereNull('parent_location_id')
                    ->orderBy('name')
                    ->get();
    }

    /**
     * Calculate total cost for all devices in this location
     */
    public function getTotalCost()
    {
        return $this->devices->sum('total_price');
    }

    /**
     * Get total cost including sub-locations
     */
    public function getTotalCostWithSubLocations()
    {
        $cost = $this->devices->sum('total_price');

        // Add cost from sub-locations
        foreach ($this->subLocations as $subLocation) {
            $cost += $subLocation->getTotalCostWithSubLocations();
        }

        return $cost;
    }

    /**
     * Get device count for this location
     */
    public function getDeviceCount()
    {
        return $this->devices->sum('quantity');
    }

    /**
     * Get device count including sub-locations
     */
    public function getDeviceCountWithSubLocations()
    {
        $count = $this->devices->sum('quantity');

        // Add devices from sub-locations
        foreach ($this->subLocations as $subLocation) {
            $count += $subLocation->getDeviceCountWithSubLocations();
        }

        return $count;
    }

    /**
     * Get unique device types in this location
     */
    public function getDeviceTypes()
    {
        return $this->devices->count();
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
}