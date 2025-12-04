<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * LOGIN
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'   => 'Validation failed',
                'message' => $validator->errors()->first()
            ], 422);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'error' => 'Account is deactivated'
            ], 403);
        }

        // Create token (your custom base64 token)
        $payload = [
            'id'    => $user->id,
            'email' => $user->email,
            'role'  => $user->role,
            'exp'   => time() + (60 * 60 * 24), // 24 hours
        ];

        $token = base64_encode(json_encode($payload));

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'token_type' => 'bearer',
            'expires_in' => 86400,
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role
            ],
            'force_password_change' => $user->force_password_change ?? false
        ]);
    }

    /**
     * LOGOUT
     */
    public function logout()
    {
        // Logout is handled client-side
        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * REFRESH TOKEN
     */
    public function refresh(Request $request)
    {
        $user = $this->getUserFromToken($request);

        if (!$user instanceof User) {
            return $user; // error response
        }

        $newToken = base64_encode(json_encode([
            'id'    => $user->id,
            'email' => $user->email,
            'role'  => $user->role,
            'exp'   => time() + (60 * 60 * 24)
        ]));

        return response()->json([
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => 86400
        ]);
    }

    /**
     * RETURN CURRENT USER
     */
    public function me(Request $request)
    {
        $user = $this->getUserFromToken($request);

        if (!$user instanceof User) {
            return $user; // error response
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role
            ]
        ]);
    }

    /**
     * PASSWORD STATUS (Frontend calls this on every login)
     */
    public function passwordStatus(Request $request)
    {
        $user = $this->getUserFromToken($request);

        if (!$user instanceof User) {
            return $user; // error response
        }

        // Temporary static response
        return response()->json([
            'days_remaining'   => 90,
            'is_expired'       => false,
            'is_expiring_soon' => false,
            'next_expiry_date' => now()->addDays(90)->format('Y-m-d')
        ]);
    }

    /**
     * TOKEN DECODING + VALIDATION (shared by /me, /refresh, password-status)
     */
    private function getUserFromToken(Request $request)
    {
        $auth = $request->header('Authorization');

        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        $token = substr($auth, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['id'])) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return response()->json(['error' => 'Token expired'], 401);
        }

        $user = User::find($decoded['id']);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['error' => 'Account is deactivated'], 403);
        }

        return $user;
    }
}
