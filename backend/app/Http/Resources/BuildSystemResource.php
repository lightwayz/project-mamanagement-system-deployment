<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuildSystemResource extends JsonResource
{
    /**
     * Transform the resource into an array with camelCase keys
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'totalCost' => $this->total_cost,
            'total_cost' => $this->total_cost, // Keep snake_case for backward compatibility
            'createdBy' => $this->created_by,
            'created_by' => $this->created_by, // Keep snake_case for backward compatibility
            'isActive' => $this->is_active,
            'is_active' => $this->is_active, // Keep snake_case for backward compatibility
            'createdAt' => $this->created_at,
            'created_at' => $this->created_at,
            'updatedAt' => $this->updated_at,
            'updated_at' => $this->updated_at,
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                    'role' => $this->creator->role,
                ];
            }),
            'locations' => $this->whenLoaded('locations', function () {
                return $this->locations->map(function ($location) {
                    return $this->transformLocation($location);
                });
            }),
        ];
    }

    /**
     * Transform a location with all its nested data
     */
    private function transformLocation($location): array
    {
        return [
            'id' => $location->id,
            'name' => $location->name,
            'description' => $location->description,
            'level' => $location->level,
            'parentLocationId' => $location->parent_location_id,
            'parent_location_id' => $location->parent_location_id, // Keep snake_case
            'devices' => $location->devices->map(function ($device) {
                return [
                    'id' => $device->id,
                    'deviceId' => $device->device_id,
                    'device_id' => $device->device_id, // Keep snake_case
                    'quantity' => $device->quantity,
                    'unitPrice' => $device->unit_price,
                    'unit_price' => $device->unit_price, // Keep snake_case
                    'totalPrice' => $device->total_price,
                    'total_price' => $device->total_price, // Keep snake_case
                    'device' => $device->device ? [
                        'id' => $device->device->id,
                        'name' => $device->device->name,
                        'category' => $device->device->category,
                        'subCategory' => $device->device->sub_category,
                        'sub_category' => $device->device->sub_category,
                        'brand' => $device->device->brand,
                        'model' => $device->device->model,
                        'description' => $device->device->description,
                        'costPrice' => $device->device->cost_price,
                        'cost_price' => $device->device->cost_price,
                        'sellingPrice' => $device->device->selling_price,
                        'selling_price' => $device->device->selling_price,
                        'imageUrl' => $device->device->image_url,
                        'image_url' => $device->device->image_url,
                    ] : null,
                ];
            }),
            'subLocations' => $location->subLocations->map(function ($subLocation) {
                return [
                    'id' => $subLocation->id,
                    'name' => $subLocation->name,
                    'description' => $subLocation->description,
                    'level' => $subLocation->level,
                    'parentLocationId' => $subLocation->parent_location_id,
                    'parent_location_id' => $subLocation->parent_location_id,
                    'devices' => $subLocation->devices->map(function ($device) {
                        return [
                            'id' => $device->id,
                            'deviceId' => $device->device_id,
                            'device_id' => $device->device_id,
                            'quantity' => $device->quantity,
                            'unitPrice' => $device->unit_price,
                            'unit_price' => $device->unit_price,
                            'totalPrice' => $device->total_price,
                            'total_price' => $device->total_price,
                            'device' => $device->device ? [
                                'id' => $device->device->id,
                                'name' => $device->device->name,
                                'category' => $device->device->category,
                                'subCategory' => $device->device->sub_category,
                                'sub_category' => $device->device->sub_category,
                                'brand' => $device->device->brand,
                                'model' => $device->device->model,
                                'description' => $device->device->description,
                                'costPrice' => $device->device->cost_price,
                                'cost_price' => $device->device->cost_price,
                                'sellingPrice' => $device->device->selling_price,
                                'selling_price' => $device->device->selling_price,
                                'imageUrl' => $device->device->image_url,
                                'image_url' => $device->device->image_url,
                            ] : null,
                        ];
                    }),
                ];
            }),
        ];
    }
}
