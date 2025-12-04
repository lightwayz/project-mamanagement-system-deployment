<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Client::query();

            // Search functionality
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('company', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Order by created_at descending by default
            $query->orderBy('created_at', 'desc');

            $clients = $query->get();

            // Transform to match the expected format
            $transformedClients = $clients->map(function ($client) {
                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'company' => $client->company,
                    'notes' => $client->notes,
                    'created_at' => $client->created_at->toISOString(),
                    'updated_at' => $client->updated_at->toISOString(),
                ];
            });

            return response()->json([
                'data' => $transformedClients
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255',
            'phone' => 'required|string|regex:/^\+?[0-9\s\-\(\)]{7,20}$/|max:20',
            'address' => 'required|string|max:1000',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = Client::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'company' => $request->company,
                'notes' => $request->notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'company' => $client->company,
                    'notes' => $client->notes,
                    'created_at' => $client->created_at->toISOString(),
                    'updated_at' => $client->updated_at->toISOString(),
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified client.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'company' => $client->company,
                    'notes' => $client->notes,
                    'created_at' => $client->created_at->toISOString(),
                    'updated_at' => $client->updated_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified client in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|min:2|max:255',
            'email' => 'sometimes|required|string|email|max:255',
            'phone' => 'sometimes|required|string|regex:/^\+?[0-9\s\-\(\)]{7,20}$/|max:20',
            'address' => 'sometimes|required|string|max:1000',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = Client::findOrFail($id);
            $client->update($request->only(['name', 'email', 'phone', 'address', 'company', 'notes']));

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'company' => $client->company,
                    'notes' => $client->notes,
                    'created_at' => $client->created_at->toISOString(),
                    'updated_at' => $client->updated_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified client from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);
            $client->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}