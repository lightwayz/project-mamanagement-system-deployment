<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Client;
use App\Models\Device;
use App\Models\Proposal;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        try {
            // Decode token from Authorization header (same pattern as AuthController::me())
            $authHeader = $request->header('Authorization');
            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'No token provided',
                    'total_projects' => 0,
                    'active_projects' => 0,
                    'total_clients' => 0,
                    'monthly_revenue' => 0,
                    'pending_proposals' => 0,
                    'low_stock_items' => 0,
                    'total_users' => 0,
                    'total_devices' => 0,
                ], 401);
            }

            $token = substr($authHeader, 7);
            $decoded = json_decode(base64_decode($token), true);

            if (!$decoded || !isset($decoded['id'])) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'Invalid token',
                    'total_projects' => 0,
                    'active_projects' => 0,
                    'total_clients' => 0,
                    'monthly_revenue' => 0,
                    'pending_proposals' => 0,
                    'low_stock_items' => 0,
                    'total_users' => 0,
                    'total_devices' => 0,
                ], 401);
            }

            // Find user by ID from token
            $user = User::find($decoded['id']);
            if (!$user) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'User not found',
                    'total_projects' => 0,
                    'active_projects' => 0,
                    'total_clients' => 0,
                    'monthly_revenue' => 0,
                    'pending_proposals' => 0,
                    'low_stock_items' => 0,
                    'total_users' => 0,
                    'total_devices' => 0,
                ], 401);
            }

            $stats = [
                'total_projects' => $this->getTotalProjects($user),
                'active_projects' => $this->getActiveProjects($user),
                'total_clients' => $this->getTotalClients($user),
                'monthly_revenue' => $this->getMonthlyRevenue($user),
                'pending_proposals' => $this->getPendingProposals($user),
                'low_stock_items' => $this->getLowStockItems($user),
                'total_users' => $this->getTotalUsers($user),
                'total_devices' => $this->getTotalDevices($user),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve dashboard statistics',
                'message' => $e->getMessage(),
                'total_projects' => 0,
                'active_projects' => 0,
                'total_clients' => 0,
                'monthly_revenue' => 0,
                'pending_proposals' => 0,
                'low_stock_items' => 0,
                'total_users' => 0,
                'total_devices' => 0,
            ], 500);
        }
    }

    private function getTotalProjects($user)
    {
        $query = Project::query();

        if ($user->role === 'salesperson') {
            $query->where('salesperson_id', $user->id);
        } elseif ($user->role === 'technician') {
            // Technicians can see all projects (tasks relationship not implemented yet)
            // TODO: Implement tasks relationship and filter by assigned tasks
        }

        return $query->count();
    }

    private function getActiveProjects($user)
    {
        $query = Project::where('status', 'active');

        if ($user->role === 'salesperson') {
            $query->where('salesperson_id', $user->id);
        } elseif ($user->role === 'technician') {
            // Technicians can see all active projects (tasks relationship not implemented yet)
            // TODO: Implement tasks relationship and filter by assigned tasks
        }

        return $query->count();
    }

    private function getTotalClients($user)
    {
        if ($user->role === 'technician') {
            return 0;
        }
        
        $query = Client::query();
        
        if ($user->role === 'salesperson') {
            $query->whereHas('projects', function($q) use ($user) {
                $q->where('salesperson_id', $user->id);
            });
        }
        
        return $query->count();
    }

    private function getMonthlyRevenue($user)
    {
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Use end_date for completed projects, fallback to created_at if end_date is null
        $query = Project::where('status', 'completed')
                       ->where(function($q) use ($startOfMonth, $endOfMonth) {
                           $q->whereBetween('end_date', [$startOfMonth, $endOfMonth])
                             ->orWhere(function($q2) use ($startOfMonth, $endOfMonth) {
                                 $q2->whereNull('end_date')
                                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
                             });
                       });

        if ($user->role === 'salesperson') {
            $query->where('salesperson_id', $user->id);
        } elseif ($user->role === 'technician') {
            return 0;
        }

        return $query->sum('total_cost');
    }

    private function getPendingProposals($user)
    {
        if ($user->role === 'technician') {
            return 0;
        }
        
        $query = Proposal::where('status', 'pending');
        
        if ($user->role === 'salesperson') {
            $query->whereHas('project', function($q) use ($user) {
                $q->where('salesperson_id', $user->id);
            });
        }
        
        return $query->count();
    }

    private function getLowStockItems($user)
    {
        if ($user->role !== 'admin') {
            return 0;
        }

        // TODO: Implement inventory tracking and low stock detection
        // For now, return 0 as we don't have quantity tracking yet
        return 0;
    }

    private function getTotalUsers($user)
    {
        // Only admins can see total user count
        if ($user->role !== 'admin') {
            return 0;
        }

        return User::count();
    }

    private function getTotalDevices($user)
    {
        // All users can see device count
        return Device::count();
    }
}