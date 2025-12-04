<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use App\Models\BuildSystem;
use App\Models\BuildSystemLocation;
use App\Models\BuildSystemDevice;
use App\Models\Device;
use App\Http\Resources\BuildSystemResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BuildSystemController extends Controller
{
    /**
     * Display a listing of build systems
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = BuildSystem::with(['creator', 'locations'])
                ->withCount('locations');

            // Filter by search term
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Filter by active status
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            }

            // Filter by creator
            if ($request->has('created_by')) {
                $query->where('created_by', $request->created_by);
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            // Map sort fields
            $allowedSortFields = ['name', 'total_cost', 'created_at', 'updated_at', 'locations_count'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $buildSystems = $query->paginate($perPage);

            return response()->json($buildSystems);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve build systems',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new build system
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'locations' => 'required|array|min:1',
                'locations.*.name' => 'required|string|max:255',
                'locations.*.description' => 'nullable|string',
                'locations.*.level' => 'nullable|integer',
                'locations.*.devices' => 'nullable|array',
                'locations.*.devices.*.device_id' => 'required|integer|exists:devices,id',
                'locations.*.devices.*.quantity' => 'required|integer|min:1',
                'locations.*.devices.*.unit_price' => 'required|numeric|min:0',
                'locations.*.subLocations' => 'nullable|array',
                'locations.*.subLocations.*.name' => 'required|string|max:255',
                'locations.*.subLocations.*.description' => 'nullable|string',
                'locations.*.subLocations.*.level' => 'nullable|integer',
                'locations.*.subLocations.*.devices' => 'nullable|array',
                'locations.*.subLocations.*.devices.*.device_id' => 'required|integer|exists:devices,id',
                'locations.*.subLocations.*.devices.*.quantity' => 'required|integer|min:1',
                'locations.*.subLocations.*.devices.*.unit_price' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Decode token to get user ID (same pattern as AuthController)
            $authHeader = $request->header('Authorization');
            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                return response()->json(['error' => 'No token provided'], 401);
            }

            $token = substr($authHeader, 7);
            $decoded = json_decode(base64_decode($token), true);

            if (!$decoded || !isset($decoded['id'])) {
                return response()->json(['error' => 'Invalid token'], 401);
            }

            $userId = $decoded['id'];

            DB::beginTransaction();

            // Create build system
            $buildSystem = BuildSystem::create([
                'name' => $request->name,
                'description' => $request->description,
                'created_by' => $userId,
                'total_cost' => 0,
                'is_active' => true
            ]);

            // Process locations and sub-locations
            foreach ($request->locations as $locationData) {
                // Create main location
                $location = $buildSystem->locations()->create([
                    'name' => $locationData['name'],
                    'description' => $locationData['description'] ?? null,
                    'level' => $locationData['level'] ?? 0,
                    'parent_location_id' => null
                ]);

                // Add devices to main location
                if (isset($locationData['devices']) && is_array($locationData['devices'])) {
                    foreach ($locationData['devices'] as $deviceData) {
                        $location->devices()->create([
                            'device_id' => $deviceData['device_id'],
                            'quantity' => $deviceData['quantity'],
                            'unit_price' => $deviceData['unit_price']
                        ]);
                    }
                }

                // Process sub-locations
                if (isset($locationData['subLocations']) && is_array($locationData['subLocations'])) {
                    foreach ($locationData['subLocations'] as $subLocationData) {
                        $subLocation = $buildSystem->locations()->create([
                            'name' => $subLocationData['name'],
                            'description' => $subLocationData['description'] ?? null,
                            'level' => $subLocationData['level'] ?? 1,
                            'parent_location_id' => $location->id
                        ]);

                        // Add devices to sub-location
                        if (isset($subLocationData['devices']) && is_array($subLocationData['devices'])) {
                            foreach ($subLocationData['devices'] as $deviceData) {
                                $subLocation->devices()->create([
                                    'device_id' => $deviceData['device_id'],
                                    'quantity' => $deviceData['quantity'],
                                    'unit_price' => $deviceData['unit_price']
                                ]);
                            }
                        }
                    }
                }
            }

            // Calculate total cost
            $buildSystem->calculateTotalCost();

            DB::commit();

            // Load relationships for response
            $buildSystem->load(['creator', 'locations.devices.device', 'locations.subLocations.devices.device']);

            return response()->json([
                'message' => 'Build system created successfully',
                'build_system' => $buildSystem
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to create build system',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a specific build system
     */
    public function show($id): JsonResponse
    {
        try {
            $buildSystem = BuildSystem::with([
                'creator',
                'locations' => function ($query) {
                    $query->whereNull('parent_location_id')
                          ->with(['devices.device', 'subLocations.devices.device']);
                }
            ])->findOrFail($id);

            return response()->json(new BuildSystemResource($buildSystem));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Build system not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update a build system
     */
    public function update(Request $request, BuildSystem $buildSystem): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
                'locations' => 'sometimes|array',
                'locations.*.id' => 'nullable|exists:build_system_locations,id',
                'locations.*.name' => 'required|string|max:255',
                'locations.*.description' => 'nullable|string',
                'locations.*.level' => 'nullable|integer',
                'locations.*.devices' => 'required|array',
                'locations.*.devices.*.id' => 'nullable|exists:build_system_devices,id',
                'locations.*.devices.*.device_id' => 'required|exists:devices,id',
                'locations.*.devices.*.quantity' => 'required|integer|min:1',
                'locations.*.devices.*.unit_price' => 'required|numeric|min:0',
                'locations.*.subLocations' => 'nullable|array',
                'locations.*.subLocations.*.name' => 'required|string|max:255',
                'locations.*.subLocations.*.description' => 'nullable|string',
                'locations.*.subLocations.*.level' => 'nullable|integer',
                'locations.*.subLocations.*.devices' => 'nullable|array',
                'locations.*.subLocations.*.devices.*.device_id' => 'required|exists:devices,id',
                'locations.*.subLocations.*.devices.*.quantity' => 'required|integer|min:1',
                'locations.*.subLocations.*.devices.*.unit_price' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Update build system basic info
            $buildSystem->update($request->only(['name', 'description', 'is_active']));

            // Update locations if provided
            if ($request->has('locations')) {
                // Delete existing locations and devices (cascade)
                $buildSystem->locations()->delete();

                // Create new locations and devices
                foreach ($request->locations as $locationData) {
                    $location = $buildSystem->locations()->create([
                        'name' => $locationData['name'],
                        'description' => $locationData['description'] ?? null,
                        'level' => $locationData['level'] ?? 0,
                        'parent_location_id' => null
                    ]);

                    // Add devices to main location
                    if (isset($locationData['devices']) && is_array($locationData['devices'])) {
                        foreach ($locationData['devices'] as $deviceData) {
                            $location->devices()->create([
                                'device_id' => $deviceData['device_id'],
                                'quantity' => $deviceData['quantity'],
                                'unit_price' => $deviceData['unit_price']
                            ]);
                        }
                    }

                    // Process sub-locations
                    if (isset($locationData['subLocations']) && is_array($locationData['subLocations'])) {
                        foreach ($locationData['subLocations'] as $subLocationData) {
                            $subLocation = $buildSystem->locations()->create([
                                'name' => $subLocationData['name'],
                                'description' => $subLocationData['description'] ?? null,
                                'level' => $subLocationData['level'] ?? 1,
                                'parent_location_id' => $location->id
                            ]);

                            // Add devices to sub-location
                            if (isset($subLocationData['devices']) && is_array($subLocationData['devices'])) {
                                foreach ($subLocationData['devices'] as $deviceData) {
                                    $subLocation->devices()->create([
                                        'device_id' => $deviceData['device_id'],
                                        'quantity' => $deviceData['quantity'],
                                        'unit_price' => $deviceData['unit_price']
                                    ]);
                                }
                            }
                        }
                    }
                }

                // Recalculate total cost
                $buildSystem->calculateTotalCost();
            }

            DB::commit();

            $buildSystem->load(['creator', 'locations.devices.device', 'locations.subLocations.devices.device']);

            return response()->json([
                'message' => 'Build system updated successfully',
                'build_system' => $buildSystem
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to update build system',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a build system
     */
    public function destroy(BuildSystem $buildSystem): JsonResponse
    {
        try {
            $buildSystem->delete();

            return response()->json([
                'message' => 'Build system deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete build system',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clone a build system
     */
    public function clone(Request $request, BuildSystem $buildSystem): JsonResponse
    {
        try {
            // Decode token to get user ID (same pattern as AuthController)
            $authHeader = $request->header('Authorization');
            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                return response()->json(['error' => 'No token provided'], 401);
            }

            $token = substr($authHeader, 7);
            $decoded = json_decode(base64_decode($token), true);

            if (!$decoded || !isset($decoded['id'])) {
                return response()->json(['error' => 'Invalid token'], 401);
            }

            $userId = $decoded['id'];

            DB::beginTransaction();

            // Create new build system
            $newBuildSystem = BuildSystem::create([
                'name' => $buildSystem->name . ' (Copy)',
                'description' => $buildSystem->description,
                'created_by' => $userId,
                'total_cost' => 0,
                'is_active' => true
            ]);

            // Clone locations and devices
            foreach ($buildSystem->locations()->whereNull('parent_location_id')->get() as $location) {
                $newLocation = $newBuildSystem->locations()->create([
                    'name' => $location->name,
                    'description' => $location->description,
                    'level' => $location->level,
                    'parent_location_id' => null
                ]);

                // Clone devices for main location
                foreach ($location->devices as $device) {
                    $newLocation->devices()->create([
                        'device_id' => $device->device_id,
                        'quantity' => $device->quantity,
                        'unit_price' => $device->unit_price
                    ]);
                }

                // Clone sub-locations
                foreach ($location->subLocations as $subLocation) {
                    $newSubLocation = $newBuildSystem->locations()->create([
                        'name' => $subLocation->name,
                        'description' => $subLocation->description,
                        'level' => $subLocation->level,
                        'parent_location_id' => $newLocation->id
                    ]);

                    // Clone devices for sub-location
                    foreach ($subLocation->devices as $device) {
                        $newSubLocation->devices()->create([
                            'device_id' => $device->device_id,
                            'quantity' => $device->quantity,
                            'unit_price' => $device->unit_price
                        ]);
                    }
                }
            }

            // Calculate total cost
            $newBuildSystem->calculateTotalCost();

            DB::commit();

            $newBuildSystem->load(['creator', 'locations.devices.device', 'locations.subLocations.devices.device']);

            return response()->json([
                'message' => 'Build system cloned successfully',
                'build_system' => $newBuildSystem
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to clone build system',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle active status of a build system
     */
    public function toggleActive(BuildSystem $buildSystem): JsonResponse
    {
        try {
            $buildSystem->update([
                'is_active' => !$buildSystem->is_active
            ]);

            return response()->json([
                'message' => 'Build system status updated successfully',
                'build_system' => $buildSystem
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle build system status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import build system to a project
     */
    public function importToProject(Request $request, $buildSystemId): JsonResponse
    {
        try {
            $buildSystem = BuildSystem::with([
                'locations' => function ($query) {
                    $query->whereNull('parent_location_id')
                          ->with(['devices.device', 'subLocations.devices.device']);
                }
            ])->findOrFail($buildSystemId);

            // Prepare locations data for import
            $locations = [];
            $devices = [];

            foreach ($buildSystem->locations as $location) {
                $locationData = [
                    'id' => $location->id,
                    'name' => $location->name,
                    'description' => $location->description,
                    'level' => $location->level,
                    'parent_location_id' => $location->parent_location_id,
                    'devices' => [],
                    'subLocations' => []
                ];

                // Add main location devices
                foreach ($location->devices as $device) {
                    $deviceData = [
                        'id' => $device->id,
                        'device_id' => $device->device_id,
                        'name' => $device->device->name,
                        'category' => $device->device->category,
                        'brand' => $device->device->brand,
                        'model' => $device->device->model,
                        'quantity' => $device->quantity,
                        'unit_price' => $device->unit_price,
                        'selling_price' => $device->device->selling_price,
                        'image_url' => $device->device->image_url,
                        'location_name' => $location->name,
                        'assigned_location' => $location->name
                    ];

                    $locationData['devices'][] = $deviceData;
                    $devices[] = $deviceData;
                }

                // Add sub-locations
                foreach ($location->subLocations as $subLocation) {
                    $subLocationData = [
                        'id' => $subLocation->id,
                        'name' => $subLocation->name,
                        'description' => $subLocation->description,
                        'level' => $subLocation->level,
                        'parent_location_id' => $subLocation->parent_location_id,
                        'devices' => []
                    ];

                    // Add sub-location devices
                    foreach ($subLocation->devices as $device) {
                        $deviceData = [
                            'id' => $device->id,
                            'device_id' => $device->device_id,
                            'name' => $device->device->name,
                            'category' => $device->device->category,
                            'brand' => $device->device->brand,
                            'model' => $device->device->model,
                            'quantity' => $device->quantity,
                            'unit_price' => $device->unit_price,
                            'selling_price' => $device->device->selling_price,
                            'image_url' => $device->device->image_url,
                            'location_name' => $subLocation->name,
                            'assigned_location' => $subLocation->name
                        ];

                        $subLocationData['devices'][] = $deviceData;
                        $devices[] = $deviceData;
                    }

                    $locationData['subLocations'][] = $subLocationData;
                }

                $locations[] = $locationData;
            }

            return response()->json([
                'message' => 'Build system data retrieved for import',
                'build_system' => [
                    'id' => $buildSystem->id,
                    'name' => $buildSystem->name,
                    'description' => $buildSystem->description,
                    'total_cost' => $buildSystem->total_cost,
                    'created_by' => $buildSystem->created_by,
                    'creator' => $buildSystem->creator
                ],
                'locations' => $locations,
                'devices' => $devices,
                'total_devices' => count($devices),
                'total_locations' => count($locations)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to import build system data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get build system data for import purposes (alias method)
     */
    public function getBuildSystemData($id): ?array
    {
        try {
            $buildSystem = BuildSystem::with([
                'creator',
                'locations' => function ($query) {
                    $query->whereNull('parent_location_id')
                          ->with(['devices.device', 'subLocations.devices.device']);
                }
            ])->findOrFail($id);

            return $buildSystem->toArray();
        } catch (\Exception $e) {
            return null;
        }
    }
}
