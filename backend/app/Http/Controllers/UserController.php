<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Services\OTPService;

class UserController extends Controller
{
    protected $otpService;

    public function __construct(OTPService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * LIST USERS (Search, Filter, Sort, Pagination)
     */
    public function index(Request $request)
    {
        $query = User::select(
            'id',
            'name',
            'email',
            'role',
            'is_active',
            'created_at',
            'updated_at'
        );

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('role', 'like', "%$search%");
            });
        }

        // Role filter
        if ($request->has('role') && !empty($request->role)) {
            $query->where('role', $request->role);
        }

        // Active filter
        if ($request->has('active')) {
            $query->where('is_active', $request->active);
        }

        // Sorting
        $sort = $request->sort ?? 'created_at';
        $direction = $request->direction ?? 'desc';
        $query->orderBy($sort, $direction);

        // Pagination
        $limit = $request->limit ?? 20;
        $users = $query->paginate($limit);

        return response()->json([
            'data' => $users->items(),   // <-- Angular expects ONLY ARRAY here
            'pagination' => [
                'total' => $users->total(),
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'last_page' => $users->lastPage(),
            ]
        ], 200);
    }

    /**
     * CREATE USER
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:6',
            'role'      => 'required|in:admin,salesperson,technician',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'  => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role,
            'is_active' => true,
            'force_password_change' => true,
        ]);

        // initialize 90-day password expiry
        $user->setPasswordExpiry($user->created_at);

        return response()->json([
            'message' => 'User created successfully',
            'user'    => $user
        ], 201);
    }

    /**
     * SHOW A USER
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * UPDATE USER
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'sometimes|required|string|max:255',
            'email'     => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'role'      => 'sometimes|required|in:admin,salesperson,technician',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'  => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'is_active']));

        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $user
        ]);
    }

    /**
     * DELETE USER
     */
    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return response()->json([
                'error' => 'Cannot delete your own account'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * ACTIVATE / DEACTIVATE USER
     */
    public function toggleStatus(User $user)
    {
        if ($user->id === Auth::id()) {
            return response()->json([
                'error' => 'Cannot deactivate your own account'
            ], 422);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        return response()->json([
            'message' => 'User status updated successfully',
            'user'    => $user
        ]);
    }

    /**
     * PASSWORD EXPIRY STATUS
     */
    public function getPasswordStatus()
    {
        $user = Auth::user();
        
        return response()->json([
            'days_remaining'      => $user->getDaysUntilPasswordExpiresFromCreation(),
            'is_expired'          => $user->isPasswordExpiredFromCreation(),
            'is_expiring_soon'    => $user->isPasswordExpiringSoonFromCreation(),
            'next_expiry_date'    => $user->calculatePasswordExpiryFromCreation()->format('Y-m-d'),
            'created_at'          => $user->created_at->format('Y-m-d'),
            'password_changed_at' => $user->password_changed_at ? $user->password_changed_at->format('Y-m-d') : null,
        ]);
    }
}
