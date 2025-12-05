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
            return response()->json(['error' => 'Unauthorized: No token'], 401);
        }

        $token = substr($auth, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['id'])) {
            return response()->json(['error' => 'Unauthorized: Invalid token'], 401);
        }

        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return response()->json(['error' => 'Unauthorized: Token expired'], 401);
        }

        $user = User::find($decoded['id']);
        if (!$user) {
            return response()->json(['error' => 'Unauthorized: User not found'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['error' => 'Account deactivated'], 403);
        }

        // Attach user globally for route access
        $request->attributes->set('user', $user);

        return $next($request);
    }
}
