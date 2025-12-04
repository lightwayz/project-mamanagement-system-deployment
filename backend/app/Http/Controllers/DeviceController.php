<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class DeviceController extends Controller
{
    /**
     * Display a listing of the devices.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Device::query();

            // Filter by category if provided
            if ($request->has('category') && $request->category !== '') {
                $query->where('category', $request->category);
            }

            // Filter by active status if provided
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            }

            // Search functionality
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      ->orWhere('model', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Order by creation date (newest first)
            $query->orderBy('created_at', 'desc');

            $devices = $query->get();

            return response()->json($devices);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch devices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created device in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'manufacturer' => 'nullable|string|max:255',
                'name' => 'required|string|min:2|max:255',
                'category' => 'required|string|in:lighting,security,hvac,entertainment,networking,sensors,controllers,other',
                'sub_category' => 'nullable|string|max:255',
                'brand' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'description' => 'nullable|string',
                'short_description' => 'nullable|string|max:500',
                'phase' => 'nullable|string|max:255',
                'cost_price' => 'required|numeric|min:0',
                'retail_price' => 'nullable|numeric|min:0',
                'markup' => 'nullable|numeric|min:0|max:999.99',
                'discount' => 'nullable|numeric|min:0|max:100',
                'selling_price' => 'nullable|numeric|min:0',
                'supplier' => 'nullable|string|max:255',
                'is_taxable' => 'nullable|boolean',
                'specifications' => 'nullable|string',
                'custom_field_1' => 'nullable|string|max:255',
                'custom_field_2' => 'nullable|string|max:255',
                'custom_field_3' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $deviceData = $validator->validated();

            // Calculate selling price automatically if not provided
            $this->calculateSellingPrice($deviceData);

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = Str::uuid() . '_' . time() . '.' . $image->getClientOriginalExtension();

                // Store in public/uploads/devices directory
                $imagePath = $image->storeAs('uploads/devices', $imageName, 'public');
                $deviceData['image_url'] = Storage::url($imagePath);
            }

            // Remove image from data as it's handled above
            unset($deviceData['image']);

            $device = Device::create($deviceData);

            return response()->json([
                'success' => true,
                'message' => 'Device created successfully',
                'data' => $device
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create device',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified device.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $device = Device::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $device
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found'
            ], 404);
        }
    }

    /**
     * Update the specified device in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $device = Device::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'manufacturer' => 'nullable|string|max:255',
                'name' => 'sometimes|required|string|min:2|max:255',
                'category' => 'sometimes|required|string|in:lighting,security,hvac,entertainment,networking,sensors,controllers,other',
                'sub_category' => 'nullable|string|max:255',
                'brand' => 'sometimes|required|string|max:255',
                'model' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'short_description' => 'nullable|string|max:500',
                'phase' => 'nullable|string|max:255',
                'cost_price' => 'sometimes|required|numeric|min:0',
                'retail_price' => 'nullable|numeric|min:0',
                'markup' => 'nullable|numeric|min:0|max:999.99',
                'discount' => 'nullable|numeric|min:0|max:100',
                'selling_price' => 'nullable|numeric|min:0',
                'supplier' => 'nullable|string|max:255',
                'is_taxable' => 'nullable|boolean',
                'specifications' => 'nullable|string',
                'custom_field_1' => 'nullable|string|max:255',
                'custom_field_2' => 'nullable|string|max:255',
                'custom_field_3' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $deviceData = $validator->validated();

            // Calculate selling price automatically if not provided
            $this->calculateSellingPrice($deviceData);

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($device->image_url) {
                    $oldImagePath = str_replace('/storage/', '', $device->image_url);
                    Storage::disk('public')->delete($oldImagePath);
                }

                $image = $request->file('image');
                $imageName = Str::uuid() . '_' . time() . '.' . $image->getClientOriginalExtension();

                $imagePath = $image->storeAs('uploads/devices', $imageName, 'public');
                $deviceData['image_url'] = Storage::url($imagePath);
            }

            // Remove image from data as it's handled above
            unset($deviceData['image']);

            $device->update($deviceData);

            return response()->json([
                'success' => true,
                'message' => 'Device updated successfully',
                'data' => $device->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update device',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified device from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $device = Device::findOrFail($id);

            // Delete image if exists
            if ($device->image_url) {
                $imagePath = str_replace('/storage/', '', $device->image_url);
                Storage::disk('public')->delete($imagePath);
            }

            $device->delete();

            return response()->json([
                'success' => true,
                'message' => 'Device deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete device',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Toggle device active status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $device = Device::findOrFail($id);
            $device->is_active = !$device->is_active;
            $device->save();

            return response()->json([
                'success' => true,
                'message' => 'Device status updated successfully',
                'data' => $device
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update device status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import devices from Excel file
     */
    public function importExcel(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
                'duplicate_action' => 'sometimes|string|in:skip,update,error'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $importResult = [
                'success_count' => 0,
                'error_count' => 0,
                'duplicate_count' => 0,
                'updated_count' => 0,
                'errors' => [],
                'duplicates' => [],
                'imported_devices' => []
            ];

            // Handle CSV files differently
            if ($file->getClientOriginalExtension() === 'csv') {
                $data = $this->parseCsvFile($file);
            } else {
                $data = $this->parseExcelFile($file);
            }

            if (empty($data)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found in the uploaded file'
                ], 400);
            }

            // Process each row (skip header row)
            foreach (array_slice($data, 1) as $index => $row) {
                $rowNumber = $index + 2; // +2 because we skip header and arrays are 0-indexed
                
                try {
                    $deviceData = $this->mapRowToDeviceData($row, $rowNumber);
                    
                    if ($deviceData) {
                        // Check for duplicates
                        $duplicateDevice = $this->findDuplicateDevice($deviceData);
                        
                        if ($duplicateDevice) {
                            // Handle duplicate based on strategy (default: skip)
                            $action = $request->input('duplicate_action', 'skip'); // skip, update, error
                            
                            if ($action === 'skip') {
                                $importResult['duplicate_count']++;
                                $importResult['duplicates'][] = "Row {$rowNumber}: Skipped duplicate device '{$deviceData['name']}' (Brand: {$deviceData['brand']}, Model: {$deviceData['model']})";
                                continue;
                            } elseif ($action === 'update') {
                                $duplicateDevice->update($deviceData);
                                $importResult['updated_count']++;
                                $importResult['duplicates'][] = "Row {$rowNumber}: Updated existing device '{$deviceData['name']}' (ID: {$duplicateDevice->id})";
                                continue;
                            } else {
                                // error action
                                $importResult['error_count']++;
                                $importResult['errors'][] = "Row {$rowNumber}: Duplicate device found '{$deviceData['name']}' (Brand: {$deviceData['brand']}, Model: {$deviceData['model']})";
                                continue;
                            }
                        }
                        
                        $device = Device::create($deviceData);
                        $importResult['imported_devices'][] = $device;
                        $importResult['success_count']++;
                    }
                } catch (\Exception $e) {
                    $importResult['error_count']++;
                    $importResult['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Import completed. {$importResult['success_count']} devices imported, {$importResult['updated_count']} updated, {$importResult['duplicate_count']} duplicates, {$importResult['error_count']} errors.",
                'success_count' => $importResult['success_count'],
                'error_count' => $importResult['error_count'],
                'duplicate_count' => $importResult['duplicate_count'],
                'updated_count' => $importResult['updated_count'],
                'errors' => $importResult['errors'],
                'duplicates' => $importResult['duplicates'],
                'imported_devices' => $importResult['imported_devices']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to import devices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse Excel file and return data array
     */
    private function parseExcelFile($file): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $data = [];

            foreach ($worksheet->getRowIterator() as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                $rowData = [];
                foreach ($cellIterator as $cell) {
                    $value = $cell->getValue();
                    
                    // Handle date values
                    if (Date::isDateTime($cell)) {
                        $value = Date::excelToDateTimeObject($value)->format('Y-m-d');
                    }
                    
                    $rowData[] = $value;
                }
                $data[] = $rowData;
            }

            return $data;
        } catch (\Exception $e) {
            throw new \Exception('Failed to parse Excel file: ' . $e->getMessage());
        }
    }

    /**
     * Parse CSV file and return data array
     */
    private function parseCsvFile($file): array
    {
        try {
            $data = [];
            $handle = fopen($file->getPathname(), 'r');
            
            if ($handle) {
                while (($row = fgetcsv($handle)) !== false) {
                    $data[] = $row;
                }
                fclose($handle);
            }

            return $data;
        } catch (\Exception $e) {
            throw new \Exception('Failed to parse CSV file: ' . $e->getMessage());
        }
    }

    /**
     * Map spreadsheet row to device data array
     */
    private function mapRowToDeviceData(array $row, int $rowNumber): ?array
    {
        // Expected columns: Manufacturer, Name, Category, Sub Category, Brand, Model, Long Description, Short Description, Phase, Cost Price (Unit Cost), Retail Price(MSRP), Markup(%), Discount(%), Selling Price, Supplier, Taxable(True/False), Specifications, Custom Field 1, Custom Field 2, Custom Field 3
        if (count($row) < 14) {
            throw new \Exception('Insufficient columns. Expected at least: Manufacturer, Name, Category, Sub Category, Brand, Model, Long Description, Short Description, Phase, Cost Price, Retail Price, Markup(%), Discount(%), Selling Price');
        }

        // Skip empty rows (check both manufacturer and name)
        if (empty(trim($row[0] ?? '')) && empty(trim($row[1] ?? ''))) {
            return null;
        }

        // Parse taxable field - handle various formats (now at index 15)
        $taxableValue = strtolower(trim($row[15] ?? 'true'));
        $isTaxable = in_array($taxableValue, ['true', '1', 'yes', 'y', 'taxable']);

        $validator = Validator::make([
            'manufacturer' => trim($row[0] ?? ''),
            'name' => trim($row[1] ?? ''),
            'category' => strtolower(trim($row[2] ?? '')),
            'sub_category' => trim($row[3] ?? ''),
            'brand' => trim($row[4] ?? ''),
            'model' => trim($row[5] ?? ''),
            'long_description' => trim($row[6] ?? ''),
            'short_description' => trim($row[7] ?? ''),
            'phase' => trim($row[8] ?? ''),
            'cost_price' => $this->parseNumeric($row[9] ?? 0),
            'retail_price' => $this->parseNumeric($row[10] ?? 0),
            'markup' => $this->parseNumeric($row[11] ?? 0),
            'discount' => $this->parseNumeric($row[12] ?? 0),
            'selling_price' => $this->parseNumeric($row[13] ?? 0),
            'supplier' => trim($row[14] ?? ''),
            'is_taxable' => $isTaxable,
            'specifications' => trim($row[16] ?? ''),
            'custom_field_1' => trim($row[17] ?? ''),
            'custom_field_2' => trim($row[18] ?? ''),
            'custom_field_3' => trim($row[19] ?? ''),
        ], [
            'manufacturer' => 'nullable|string|max:255',
            'name' => 'required|string|min:2|max:255',
            'category' => 'required|string|in:lighting,security,hvac,entertainment,networking,sensors,controllers,other',
            'sub_category' => 'nullable|string|max:255',
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'long_description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'phase' => 'nullable|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
            'markup' => 'nullable|numeric|min:0|max:999.99',
            'discount' => 'nullable|numeric|min:0|max:100',
            'selling_price' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'is_taxable' => 'boolean',
            'specifications' => 'nullable|string',
            'custom_field_1' => 'nullable|string|max:255',
            'custom_field_2' => 'nullable|string|max:255',
            'custom_field_3' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors()->all();
            throw new \Exception(implode(', ', $errors));
        }

        $data = $validator->validated();
        // Map long_description to description for existing database field
        $data['description'] = $data['long_description'];
        unset($data['long_description']);
        
        $data['is_active'] = true; // Default to active

        return $data;
    }

    /**
     * Find duplicate device based on name, brand, and model combination
     */
    private function findDuplicateDevice(array $deviceData): ?Device
    {
        return Device::where('name', $deviceData['name'])
                    ->where('brand', $deviceData['brand'])
                    ->where('model', $deviceData['model'])
                    ->first();
    }

    /**
     * Parse numeric value from string
     */
    private function parseNumeric($value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }
        
        // Remove currency symbols and parse
        $cleaned = preg_replace('/[^\d.,]/', '', $value);
        return (float) str_replace(',', '', $cleaned);
    }

    /**
     * Parse integer value from string
     */
    private function parseInteger($value): int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }

        $cleaned = preg_replace('/[^\d]/', '', $value);
        return (int) $cleaned;
    }

    /**
     * Calculate selling price automatically based on retail price, markup, and discount
     * Formula: Selling Price = Retail Price × (1 + Markup%) × (1 - Discount%)
     */
    private function calculateSellingPrice(array &$deviceData): void
    {
        // If selling_price is not provided or is null, calculate it
        if (!isset($deviceData['selling_price']) || $deviceData['selling_price'] === null) {
            $retailPrice = $deviceData['retail_price'] ?? 0;
            $markup = $deviceData['markup'] ?? 0;
            $discount = $deviceData['discount'] ?? 0;

            // Formula: Retail Price × (1 + Markup%) × (1 - Discount%)
            $sellingPrice = $retailPrice * (1 + $markup / 100) * (1 - $discount / 100);

            // Round to 2 decimal places
            $deviceData['selling_price'] = round($sellingPrice, 2);
        }
    }
}