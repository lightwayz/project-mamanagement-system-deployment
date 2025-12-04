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

    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at')
                    ->orderBy('created_at', 'desc')
                    ->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,salesperson,technician',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => true,
            'force_password_change' => true,
        ]);

        // Set initial password expiry to 90 days from creation date
        $user->setPasswordExpiry($user->created_at);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'sometimes|required|in:admin,salesperson,technician',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'is_active']));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy(User $user)
    {
        // Prevent deleting the current user
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

    public function requestPasswordChangeOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'action' => 'required|in:self_change,admin_reset',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $targetUser = User::find($request->user_id);
        $currentUser = Auth::user();

        // Check permissions
        if ($request->action === 'self_change' && $targetUser->id !== $currentUser->id) {
            return response()->json([
                'error' => 'You can only change your own password with self_change action'
            ], 403);
        }

        if ($request->action === 'admin_reset' && !$currentUser->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can reset other users passwords'
            ], 403);
        }

        $action = $request->action === 'self_change' ? 'password_change' : 'admin_password_reset';
        
        $otp = $this->otpService->generateOTP($currentUser, $action);
        $sent = $this->otpService->sendOTP($currentUser, $otp, $action);

        if (!$sent) {
            return response()->json([
                'error' => 'Failed to send OTP email'
            ], 500);
        }

        return response()->json([
            'message' => 'OTP sent successfully to your email',
            'expires_in_minutes' => 10,
            'remaining_attempts' => $this->otpService->getRemainingAttempts($currentUser, $action)
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'new_password' => 'required|string|min:6|confirmed',
            'otp' => 'required|string|size:6',
            'action' => 'required|in:self_change,admin_reset',
            'current_password' => 'required_if:action,self_change',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $targetUser = User::find($request->user_id);
        $currentUser = Auth::user();

        // Check permissions
        if ($request->action === 'self_change' && $targetUser->id !== $currentUser->id) {
            return response()->json([
                'error' => 'You can only change your own password with self_change action'
            ], 403);
        }

        if ($request->action === 'admin_reset' && !$currentUser->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can reset other users passwords'
            ], 403);
        }

        // For self password change, verify current password
        if ($request->action === 'self_change') {
            if (!Hash::check($request->current_password, $targetUser->password)) {
                return response()->json([
                    'error' => 'Current password is incorrect'
                ], 422);
            }
        }

        $action = $request->action === 'self_change' ? 'password_change' : 'admin_password_reset';
        
        // Verify OTP
        if (!$this->otpService->verifyOTP($currentUser, $request->otp, $action)) {
            $remainingAttempts = $this->otpService->getRemainingAttempts($currentUser, $action);
            
            if ($remainingAttempts <= 0) {
                return response()->json([
                    'error' => 'Too many failed attempts. Please request a new OTP.'
                ], 429);
            }

            return response()->json([
                'error' => 'Invalid or expired OTP',
                'remaining_attempts' => $remainingAttempts
            ], 422);
        }

        // Update password
        $targetUser->update([
            'password' => Hash::make($request->new_password),
            'force_password_change' => false,
        ]);

        // Set new password expiry to next 90-day cycle from creation date
        $targetUser->setPasswordExpiry();

        $message = $request->action === 'self_change' 
            ? 'Your password has been changed successfully'
            : "Password for {$targetUser->name} has been reset successfully";

        return response()->json([
            'message' => $message
        ]);
    }

    public function toggleStatus(User $user)
    {
        // Prevent deactivating the current user
        if ($user->id === Auth::id()) {
            return response()->json([
                'error' => 'Cannot deactivate your own account'
            ], 422);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'message' => "User {$status} successfully",
            'user' => $user
        ]);
    }

    public function getPasswordStatus()
    {
        $user = Auth::user();
        
        return response()->json([
            'days_remaining' => $user->getDaysUntilPasswordExpiresFromCreation(),
            'is_expired' => $user->isPasswordExpiredFromCreation(),
            'is_expiring_soon' => $user->isPasswordExpiringSoonFromCreation(),
            'next_expiry_date' => $user->calculatePasswordExpiryFromCreation()->format('Y-m-d'),
            'created_at' => $user->created_at->format('Y-m-d'),
            'password_changed_at' => $user->password_changed_at ? $user->password_changed_at->format('Y-m-d') : null,
        ]);
    }
}