<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthControllerMock extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        // Mock user data based on email
        $email = $request->email;
        $password = $request->password;

        $mockUsers = [
            'admin@hometronix.com' => [
                'id' => 1,
                'name' => 'Admin User',
                'email' => 'admin@hometronix.com',
                'role' => 'admin'
            ],
            'john@hometronix.com' => [
                'id' => 2,
                'name' => 'John Doe',
                'email' => 'john@hometronix.com',
                'role' => 'salesperson'
            ],
            'mike@hometronix.com' => [
                'id' => 3,
                'name' => 'Mike Johnson',
                'email' => 'mike@hometronix.com',
                'role' => 'technician'
            ]
        ];

        if (isset($mockUsers[$email]) && $password === 'password') {
            $user = $mockUsers[$email];
            $token = base64_encode(json_encode($user) . '.' . time());
            
            return response()->json([
                'user' => $user,
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => 3600
            ]);
        }

        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    public function logout()
    {
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function me()
    {
        return response()->json([
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@hometronix.com',
            'role' => 'admin'
        ]);
    }
}