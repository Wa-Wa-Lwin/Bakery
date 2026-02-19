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
        $minDobYear = (int) date('Y') - 15;

        $validated = $request->validate([
            'full_name'          => ['required', 'string', 'max:100', 'regex:/^[A-Za-z ]+$/'],
            'access_code'        => ['required', 'string', 'max:10', 'regex:/^[0-9]+$/', 'unique:staff,access_code'],
            'dob'                => ['required', 'date', 'before_or_equal:' . $minDobYear . '-12-31'],
            'email'              => ['required', 'email', 'max:100'],
            'joined_date'        => ['required', 'date', 'before_or_equal:today'],
            'is_active'          => ['required', 'boolean'],
            'role_name'          => ['required', 'string', 'in:Staff,Manager,Owner'],
            'can_toggle_channel' => ['required', 'boolean'],
            'can_waste'          => ['required', 'boolean'],
            'can_refund'         => ['required', 'boolean'],
        ]);

        $staff = Staff::create($validated);

        return response()->json($staff, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'is_active'          => ['sometimes', 'boolean'],
            'can_toggle_channel' => ['sometimes', 'boolean'],
            'can_waste'          => ['sometimes', 'boolean'],
            'can_refund'         => ['sometimes', 'boolean'],
        ]);

        $staff->update($validated);

        return response()->json($staff);
    }
}
