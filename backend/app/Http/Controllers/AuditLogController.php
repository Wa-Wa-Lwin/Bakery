<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = AuditLog::with('staff')
            ->orderByDesc('log_timestamp')
            ->get()
            ->map(fn($log) => $this->format($log));

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff_id'  => 'required|integer|exists:staff,staff_id',
            'action'    => 'required|string|max:100',
            'details'   => 'nullable|string',
            'user_name' => 'required|string|max:100',
            'role'      => 'required|string|max:50',
        ]);

        $log = AuditLog::create([
            'staff_id'        => $data['staff_id'],
            'action_describe' => mb_substr($data['action'], 0, 50),
            'action'          => $data['action'],
            'details'         => $data['details'] ?? '',
            'user_name'       => $data['user_name'],
            'role'            => $data['role'],
            'log_timestamp'   => now(),
        ]);

        return response()->json($this->format($log), 201);
    }

    private function format(AuditLog $log): array
    {
        return [
            'id'        => $log->log_id,
            'timestamp' => $log->log_timestamp?->toISOString(),
            'user_id'   => $log->staff_id,
            'user_name' => $log->user_name ?? $log->staff?->full_name ?? 'Unknown',
            'role'      => $log->role ?? $log->staff?->role_name ?? '',
            'action'    => $log->action ?? $log->action_describe,
            'details'   => $log->details ?? '',
        ];
    }
}
