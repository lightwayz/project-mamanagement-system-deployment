<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\User;

class SimpleTokenAuth
{
    public function handle($request, Closure $next)
    {
        $auth = $request->header('Authorization');

        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['error' => 'Token missing'], 401);
        }

        $token = substr($auth, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['id'])) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        $user = User::find($decoded['id']);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 401);
        }

        // Attach user to request
        $request->merge(['auth_user' => $user]);

        return $next($request);
    }
}
