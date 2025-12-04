<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => $validator->errors()->first()
            ], 422);
        }

        // Find user by email
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'error' => 'Account is deactivated'
            ], 401);
        }

        // Generate simple token (base64 encoded user data)
        $token = base64_encode(json_encode([
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + (60 * 60 * 24) // 24 hours
        ]));

        // Check for force password change or expired password
        $forcePasswordChange = $user->force_password_change || $user->isPasswordExpiredFromCreation();

        $response = [
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => 86400 // 24 hours in seconds
        ];

        if ($forcePasswordChange) {
            $response['force_password_change'] = true;
        }

        return response()->json($response);
    }

    public function logout(Request $request)
    {
        // Simple token-based logout (client-side token removal is sufficient)
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(Request $request)
    {
        // Decode the current token
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['id'])) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        // Find user and generate new token
        $user = User::find($decoded['id']);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        $newToken = base64_encode(json_encode([
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + (60 * 60 * 24)
        ]));

        return response()->json([
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => 86400
        ]);
    }

    public function me(Request $request)
    {
        // Decode token from Authorization header
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['id'])) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        $user = User::find($decoded['id']);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        return response()->json([
            'user' => $user
        ]);
    }

}