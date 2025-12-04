<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'client_id',
        'salesperson_id',
        'status',
        'start_date',
        'end_date',
        'total_cost',
        'labor_cost',
        'material_cost',
        'tax_amount',
        'company_logo_path',
        'client_logo_path',
        'project_image_path',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_cost' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'material_cost' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function salesperson()
    {
        return $this->belongsTo(User::class, 'salesperson_id');
    }

    public function locations()
    {
        return $this->hasMany(ProjectLocation::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }

    public function devices()
    {
        return $this->hasManyThrough(ProjectDevice::class, ProjectLocation::class);
    }

    public function calculateTotalCost()
    {
        $materialCost = $this->devices()->sum('total_price');
        $laborCost = $this->labor_cost ?? 0;
        $subtotal = $materialCost + $laborCost;
        $taxRate = 7.5 / 100; // Default tax rate - can be made configurable later
        $taxAmount = $subtotal * $taxRate;
        
        return [
            'material_cost' => $materialCost,
            'labor_cost' => $laborCost,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_cost' => $subtotal + $taxAmount,
        ];
    }

    public function updateTotalCost()
    {
        $costs = $this->calculateTotalCost();
        $this->update([
            'material_cost' => $costs['material_cost'],
            'labor_cost' => $costs['labor_cost'],
            'tax_amount' => $costs['tax_amount'],
            'total_cost' => $costs['total_cost'],
        ]);
    }
}