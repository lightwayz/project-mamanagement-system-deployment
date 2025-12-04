<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Project;
use App\Models\Device;
use App\Models\ProjectLocation;
use App\Models\ProjectDevice;
use App\Models\BuildSystem;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Project::with(['client', 'salesperson', 'locations.devices.device']);

            // Filter by status
            if ($request->has('status') && $request->status !== '') {
                $query->where('status', $request->status);
            }

            // Filter by client
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            // Search functionality
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Order by created_at descending
            $query->orderBy('created_at', 'desc');

            $projects = $query->get();

            return response()->json($projects);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch projects',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'client_id' => 'nullable|integer|exists:clients,id',
            'salesperson_id' => 'nullable|integer|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,active,completed,cancelled',
            'company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'client_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'project_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'locations' => 'nullable|array',
            'locations.*.name' => 'required_with:locations|string|max:255',
            'locations.*.description' => 'nullable|string',
            'locations.*.level' => 'nullable|integer|min:0|max:2',
            'locations.*.parent_location_id' => 'nullable|string',
            'locations.*.devices' => 'nullable|array',
            'locations.*.devices.*.device_id' => 'required_with:locations.*.devices|integer|exists:devices,id',
            'locations.*.devices.*.quantity' => 'required_with:locations.*.devices|integer|min:1',
            'locations.*.devices.*.unit_price' => 'required_with:locations.*.devices|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create project
            $projectData = [
                'name' => $request->name,
                'description' => $request->description,
                'client_id' => $request->client_id,
                'salesperson_id' => $request->salesperson_id,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status ?? 'pending',
            ];

            // Handle company logo upload
            if ($request->hasFile('company_logo')) {
                $path = $request->file('company_logo')->store('logos/company', 'public');
                $projectData['company_logo_path'] = $path;
            }

            // Handle client logo upload
            if ($request->hasFile('client_logo')) {
                $path = $request->file('client_logo')->store('logos/client', 'public');
                $projectData['client_logo_path'] = $path;
            }

            // Handle project image upload
            if ($request->hasFile('project_image')) {
                $path = $request->file('project_image')->store('projects/images', 'public');
                $projectData['project_image_path'] = $path;
            }

            $project = Project::create($projectData);

            $totalCost = 0;

            // Create locations and devices if provided
            if ($request->has('locations') && is_array($request->locations)) {
                foreach ($request->locations as $locationData) {
                    $location = $project->locations()->create([
                        'name' => $locationData['name'],
                        'description' => $locationData['description'] ?? null,
                        'level' => $locationData['level'] ?? 0,
                        'parent_location_id' => $locationData['parent_location_id'] ?? null,
                    ]);

                    // Add devices to location
                    if (isset($locationData['devices']) && is_array($locationData['devices'])) {
                        foreach ($locationData['devices'] as $deviceData) {
                            $totalPrice = $deviceData['quantity'] * $deviceData['unit_price'];

                            $location->devices()->create([
                                'device_id' => $deviceData['device_id'],
                                'quantity' => $deviceData['quantity'],
                                'unit_price' => $deviceData['unit_price'],
                                'total_price' => $totalPrice,
                            ]);

                            $totalCost += $totalPrice;
                        }
                    }
                }
            }

            // Update project total cost
            $project->update(['total_cost' => $totalCost]);

            DB::commit();

            // Load relationships
            $project->load(['client', 'salesperson', 'locations.devices.device']);

            return response()->json([
                'message' => 'Project created successfully',
                'project' => $project
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'error' => 'Failed to create project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified project
     */
    public function show($id): JsonResponse
    {
        try {
            $project = Project::with(['client', 'salesperson', 'locations.devices.device'])
                             ->findOrFail($id);

            return response()->json($project);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Project not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'client_id' => 'nullable|integer|exists:clients,id',
            'salesperson_id' => 'nullable|integer|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $project->update($request->only([
                'name', 'description', 'client_id', 'salesperson_id',
                'start_date', 'end_date', 'status'
            ]));

            $project->load(['client', 'salesperson', 'locations.devices.device']);

            return response()->json([
                'message' => 'Project updated successfully',
                'project' => $project
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified project
     */
    public function destroy($id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        try {
            $project->delete();

            return response()->json([
                'message' => 'Project deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available devices for project association
     */
    public function getAvailableDevices(Request $request): JsonResponse
    {
        try {
            $query = Device::where('is_active', true);

            // Filter by category
            if ($request->has('category') && $request->category !== '') {
                $query->where('category', $request->category);
            }

            // Filter by brand
            if ($request->has('brand') && $request->brand !== '') {
                $query->where('brand', 'like', '%' . $request->brand . '%');
            }

            // Search functionality
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('model', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            $devices = $query->orderBy('category')
                             ->orderBy('brand')
                             ->orderBy('name')
                             ->get();

            return response()->json($devices);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch devices',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get devices associated with a project
     */
    public function getProjectDevices($id): JsonResponse
    {
        try {
            $project = Project::with('locations.devices.device')->findOrFail($id);

            return response()->json([
                'project_id' => $project->id,
                'locations' => $project->locations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Project not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Associate devices to a project location
     */
    public function associateDevices(Request $request, $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'location_id' => 'required|integer|exists:project_locations,id',
            'devices' => 'required|array|min:1',
            'devices.*.device_id' => 'required|integer|exists:devices,id',
            'devices.*.quantity' => 'required|integer|min:1',
            'devices.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $location = ProjectLocation::where('id', $request->location_id)
                                     ->where('project_id', $project->id)
                                     ->first();

            if (!$location) {
                return response()->json(['error' => 'Location not found for this project'], 404);
            }

            DB::beginTransaction();

            foreach ($request->devices as $deviceData) {
                $totalPrice = $deviceData['quantity'] * $deviceData['unit_price'];

                $location->devices()->updateOrCreate(
                    ['device_id' => $deviceData['device_id']],
                    [
                        'quantity' => $deviceData['quantity'],
                        'unit_price' => $deviceData['unit_price'],
                        'total_price' => $totalPrice,
                    ]
                );
            }

            // Update project total cost
            $this->updateProjectTotalCost($project);

            DB::commit();

            $project->load(['locations.devices.device']);

            return response()->json([
                'message' => 'Devices associated successfully',
                'project' => $project
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'error' => 'Failed to associate devices',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update device association in project
     */
    public function updateProjectDevice(Request $request, $projectId, $deviceId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $projectDevice = ProjectDevice::whereHas('location', function($q) use ($projectId) {
                $q->where('project_id', $projectId);
            })->where('device_id', $deviceId)->first();

            if (!$projectDevice) {
                return response()->json(['error' => 'Device not found in this project'], 404);
            }

            $totalPrice = $request->quantity * $request->unit_price;

            $projectDevice->update([
                'quantity' => $request->quantity,
                'unit_price' => $request->unit_price,
                'total_price' => $totalPrice,
            ]);

            // Update project total cost
            $project = Project::find($projectId);
            $this->updateProjectTotalCost($project);

            return response()->json([
                'message' => 'Device updated successfully',
                'project_device' => $projectDevice->load('device')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update device',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove device from project
     */
    public function removeProjectDevice($projectId, $deviceId): JsonResponse
    {
        try {
            $projectDevice = ProjectDevice::whereHas('location', function($q) use ($projectId) {
                $q->where('project_id', $projectId);
            })->where('device_id', $deviceId)->first();

            if (!$projectDevice) {
                return response()->json(['error' => 'Device not found in this project'], 404);
            }

            $projectDevice->delete();

            // Update project total cost
            $project = Project::find($projectId);
            $this->updateProjectTotalCost($project);

            return response()->json([
                'message' => 'Device removed from project successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to remove device',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add devices to project with locations from device selection dialog
     */
    public function addDevicesToProject(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'locations' => 'sometimes|array',
            'locations.*.name' => 'required_with:locations|string|max:255',
            'locations.*.description' => 'nullable|string',
            'locations.*.parent_location_id' => 'nullable|string',
            'locations.*.level' => 'required|integer|min:0|max:2',
            'locations.*.subLocations' => 'sometimes|array',
            'locations.*.subLocations.*.name' => 'required|string|max:255',
            'locations.*.subLocations.*.description' => 'nullable|string',
            'locations.*.subLocations.*.parent_location_id' => 'nullable|string',
            'locations.*.subLocations.*.level' => 'required|integer|min:1|max:2',
            'devices' => 'required|array|min:1',
            'devices.*.device_id' => 'required|integer|exists:devices,id',
            'devices.*.location_id' => 'required|string',
            'devices.*.quantity' => 'required|integer|min:1',
            'devices.*.unit_price' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $project = Project::findOrFail($id);

            DB::beginTransaction();

            $locationIdMap = [];

            // Create locations
            if ($request->has('locations') && is_array($request->locations)) {
                foreach ($request->locations as $locationData) {
                    $tempId = $locationData['name']; // Use name as temporary ID

                    $location = $project->locations()->create([
                        'name' => $locationData['name'],
                        'description' => $locationData['description'] ?? null,
                        'level' => $locationData['level'] ?? 0,
                    ]);

                    $locationIdMap[$tempId] = $location->id;

                    // Create sub-locations if exist
                    if (isset($locationData['subLocations'])) {
                        foreach ($locationData['subLocations'] as $subLocationData) {
                            $subTempId = $subLocationData['name'];

                            $subLocation = $project->locations()->create([
                                'name' => $subLocationData['name'],
                                'description' => $subLocationData['description'] ?? null,
                                'level' => $subLocationData['level'] ?? 1,
                                'parent_location_id' => $location->id,
                            ]);

                            $locationIdMap[$subTempId] = $subLocation->id;
                        }
                    }
                }
            }

            // Add devices to locations
            $totalCost = 0;
            foreach ($request->devices as $deviceData) {
                $locationId = $locationIdMap[$deviceData['location_id']] ?? null;

                if ($locationId) {
                    $location = ProjectLocation::find($locationId);
                    $totalPrice = $deviceData['quantity'] * $deviceData['unit_price'];

                    $location->devices()->create([
                        'device_id' => $deviceData['device_id'],
                        'quantity' => $deviceData['quantity'],
                        'unit_price' => $deviceData['unit_price'],
                        'total_price' => $totalPrice,
                    ]);

                    $totalCost += $totalPrice;
                }
            }

            // Update project total cost
            $this->updateProjectTotalCost($project);

            DB::commit();

            return response()->json([
                'message' => 'Devices added to project successfully',
                'project_id' => $id,
                'locations_added' => count($locationIdMap),
                'devices_added' => count($request->devices),
                'total_cost' => $totalCost
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'error' => 'Failed to add devices to project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import build system to project
     */
    public function importBuildSystem(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'build_system_id' => 'required|integer|exists:build_systems,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            $project = Project::findOrFail($id);
            $buildSystem = BuildSystem::with('locations.devices.device')->findOrFail($request->build_system_id);

            DB::beginTransaction();

            $importedLocations = 0;
            $totalCostAdded = 0;

            foreach ($buildSystem->locations as $bsLocation) {
                // Create location in project
                $projectLocation = $project->locations()->create([
                    'name' => $bsLocation->name,
                    'description' => $bsLocation->description,
                    'level' => $bsLocation->level ?? 0,
                    'parent_location_id' => $bsLocation->parent_location_id,
                ]);

                $importedLocations++;

                // Import devices from build system location
                foreach ($bsLocation->devices as $bsDevice) {
                    $totalPrice = $bsDevice->quantity * $bsDevice->unit_price;

                    $projectLocation->devices()->create([
                        'device_id' => $bsDevice->device_id,
                        'quantity' => $bsDevice->quantity,
                        'unit_price' => $bsDevice->unit_price,
                        'total_price' => $totalPrice,
                    ]);

                    $totalCostAdded += $totalPrice;
                }
            }

            // Update project total cost
            $this->updateProjectTotalCost($project);

            DB::commit();

            return response()->json([
                'message' => 'Build system imported successfully',
                'imported_locations' => $importedLocations,
                'total_cost_added' => $totalCostAdded,
                'build_system_name' => $buildSystem->name
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'error' => 'Failed to import build system',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to update project total cost
     */
    private function updateProjectTotalCost(Project $project)
    {
        $totalCost = $project->locations()
                            ->with('devices')
                            ->get()
                            ->sum(function($location) {
                                return $location->devices->sum('total_price');
                            });

        $project->update(['total_cost' => $totalCost]);
    }

    /**
     * Export project as PDF proposal
     */
    public function exportPDF($id)
    {
        try {
            // Load project with all relationships
            $project = Project::with([
                'client',
                'salesperson',
                'locations' => function($query) {
                    $query->orderBy('level')->orderBy('name');
                },
                'locations.devices.device'
            ])->findOrFail($id);

            // Get settings (with fallback for mock data)
            $settings = Setting::first();
            if (!$settings) {
                $settings = (object)[
                    'company_name' => 'Hometronix Nigeria Limited',
                    'company_address' => 'Victoria Island, Lagos Nigeria',
                    'company_phone' => '+234 XXX XXX XXXX',
                    'company_email' => 'info@hometronix.com',
                    'currency' => '₦',
                    'tax_rate' => 7.50,
                    'contract_terms' => 'Standard terms and conditions apply.',
                ];
            }

            // Prepare logo paths (convert to base64 for PDF embedding)
            $companyLogo = null;
            $clientLogo = null;
            $projectImage = null;

            // Company logo: use project-specific or default
            if ($project->company_logo_path && Storage::disk('public')->exists($project->company_logo_path)) {
                $companyLogo = $this->imageToBase64(storage_path('app/public/' . $project->company_logo_path));
            } elseif (isset($settings->default_company_logo_path) && $settings->default_company_logo_path && Storage::disk('public')->exists($settings->default_company_logo_path)) {
                $companyLogo = $this->imageToBase64(storage_path('app/public/' . $settings->default_company_logo_path));
            }

            // Client logo
            if ($project->client_logo_path && Storage::disk('public')->exists($project->client_logo_path)) {
                $clientLogo = $this->imageToBase64(storage_path('app/public/' . $project->client_logo_path));
            }

            // Project image
            if ($project->project_image_path && Storage::disk('public')->exists($project->project_image_path)) {
                $projectImage = $this->imageToBase64(storage_path('app/public/' . $project->project_image_path));
            }

            // Calculate costs
            $subtotal = 0;
            $devicesByCategory = [];
            $locationCosts = [];

            // Group devices by category and calculate costs
            foreach ($project->locations as $location) {
                $locationTotal = 0;

                foreach ($location->devices as $projectDevice) {
                    $device = $projectDevice->device;
                    if (!$device) continue;

                    $category = $device->category ?? 'Uncategorized';

                    // Prepare device with image
                    $deviceData = [
                        'id' => $device->id,
                        'name' => $device->name,
                        'brand' => $device->brand,
                        'model' => $device->model,
                        'category' => $device->category,
                        'description' => $device->description,
                        'specifications' => $device->description,
                        'quantity' => $projectDevice->quantity,
                        'unit_price' => $projectDevice->unit_price,
                        'total_price' => $projectDevice->total_price,
                        'image_base64' => null,
                    ];

                    // Load device image if exists
                    if ($device->image_url && Storage::disk('public')->exists($device->image_url)) {
                        $deviceData['image_base64'] = $this->imageToBase64(storage_path('app/public/' . $device->image_url));
                    }

                    if (!isset($devicesByCategory[$category])) {
                        $devicesByCategory[$category] = [];
                    }
                    $devicesByCategory[$category][] = $deviceData;

                    $locationTotal += $projectDevice->total_price;
                    $subtotal += $projectDevice->total_price;
                }

                // Store location cost as associative array (locationName => cost)
                $locationCosts[$location->name] = $locationTotal;
            }

            $professionalFees = 19500.00; // Can be made configurable
            $totalBeforeTax = $subtotal + $professionalFees;
            $taxRate = $settings->tax_rate ?? 7.50;
            $tax = $totalBeforeTax * ($taxRate / 100);
            $grandTotal = $totalBeforeTax + $tax;

            // Payment schedule
            $paymentSchedule = [
                'mobilization_percent' => 85,
                'mobilization_amount' => $grandTotal * 0.85,
                'final_percent' => 15,
                'final_amount' => $grandTotal * 0.15,
            ];

            // Prepare data for PDF
            $pdfData = [
                'project' => $project,
                'settings' => $settings,
                'companyLogo' => $companyLogo,
                'clientLogo' => $clientLogo,
                'projectImage' => $projectImage,
                'devicesByCategory' => $devicesByCategory,
                'locationCosts' => $locationCosts,
                'subtotal' => $subtotal,
                'professionalFees' => $professionalFees,
                'totalBeforeTax' => $totalBeforeTax,
                'tax' => $tax,
                'taxRate' => $taxRate,
                'grandTotal' => $grandTotal,
                'paymentSchedule' => $paymentSchedule,
                'currentDate' => now()->format('d/m/Y'),
                'revision' => 0,
            ];

            // Generate PDF
            $pdf = PDF::loadView('pdf.project-proposal', $pdfData);
            $pdf->setPaper('A4', 'portrait');

            $filename = str_replace(' ', '_', $project->name) . '_Proposal_' . now()->format('Y-m-d') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate PDF',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to convert image to base64
     */
    private function imageToBase64($imagePath)
    {
        if (!file_exists($imagePath)) {
            return null;
        }

        $imageData = file_get_contents($imagePath);
        $base64 = base64_encode($imageData);
        $extension = pathinfo($imagePath, PATHINFO_EXTENSION);
        $mimeType = 'image/' . $extension;

        return 'data:' . $mimeType . ';base64,' . $base64;
    }
}
