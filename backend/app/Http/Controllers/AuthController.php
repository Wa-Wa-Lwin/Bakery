<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'access_code' => ['required', 'string', 'regex:/^\d{5}$/'],
        ]);

        $staff = Staff::where('access_code', $request->access_code)
                       ->where('is_active', true)
                       ->first();

        if (!$staff) {
            return response()->json([
                'message' => 'Invalid access code or account is inactive.',
            ], 401);
        }

        return response()->json($staff);
    }
}
