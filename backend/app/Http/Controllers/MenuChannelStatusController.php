<?php

namespace App\Http\Controllers;

use App\Models\MenuChannelStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuChannelStatusController extends Controller
{
    public function update(Request $request, int $itemId, int $orderTypeId): JsonResponse
    {
        $data = $request->validate([
            'is_available' => 'required|boolean',
        ]);

        $status = MenuChannelStatus::where('item_id', $itemId)
            ->where('order_type_id', $orderTypeId)
            ->firstOrFail();

        $status->update(['is_available' => $data['is_available']]);

        return response()->json([
            'item_id'       => $status->item_id,
            'order_type_id' => $status->order_type_id,
            'is_available'  => (bool) $status->is_available,
        ]);
    }
}
