<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'manufacturer',
        'name',
        'category',
        'sub_category',
        'brand',
        'model',
        'description',
        'short_description',
        'phase',
        'cost_price',
        'retail_price',
        'markup',
        'discount',
        'selling_price',
        'supplier',
        'is_taxable',
        'specifications',
        'custom_field_1',
        'custom_field_2',
        'custom_field_3',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'retail_price' => 'decimal:2',
        'markup' => 'decimal:2',
        'discount' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_taxable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function projectDevices()
    {
        return $this->hasMany(ProjectDevice::class);
    }


    public function getFullNameAttribute()
    {
        return $this->brand . ' ' . $this->model . ' - ' . $this->name;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }


    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}