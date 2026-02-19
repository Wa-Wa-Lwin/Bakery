<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = Staff::orderBy('created_at', 'desc')->get();
        return response()->json($staff);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name'          => ['required', 'string', 'max:100', 'regex:/^[A-Za-z ]+$/'],
            'access_code'        => ['required', 'string', 'max:10', 'unique:staff,access_code'],
            'dob'                => ['required', 'date'],
            'email'              => ['required', 'email', 'max:100'],
            'joined_date'        => ['required', 'date'],
            'is_active'          => ['boolean'],
            'role_name'          => ['required', 'string', 'max:30', 'regex:/^[A-Za-z ]+$/'],
            'can_toggle_channel' => ['boolean'],
            'can_waste'          => ['boolean'],
            'can_refund'         => ['boolean'],
        ]);

        $staff = Staff::create($validated);

        return response()->json($staff, 201);
    }
}
