<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\MenuChannelStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = MenuItem::with('menuChannelStatuses')
            ->orderBy('category_name')
            ->orderBy('item_name')
            ->get()
            ->map(fn($item) => $this->format($item));

        return response()->json($items);
    }

    public function categories(): JsonResponse
    {
        $cats = MenuItem::select('category_name')
            ->distinct()
            ->orderBy('category_name')
            ->pluck('category_name');

        return response()->json($cats);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_name'     => 'required|string|max:100',
            'unit_cost'     => 'required|numeric|min:0',
            'category_name' => 'required|string|max:50',
            'is_published'  => 'boolean',
        ]);

        $item = MenuItem::create([
            'item_name'     => $data['item_name'],
            'unit_cost'     => $data['unit_cost'],
            'category_name' => $data['category_name'],
            'is_published'  => $data['is_published'] ?? true,
            'is_archived'   => false,
        ]);

        // Create channel statuses for takeaway (1) and eat_in (2)
        MenuChannelStatus::insert([
            ['item_id' => $item->item_id, 'order_type_id' => 1, 'is_available' => true],
            ['item_id' => $item->item_id, 'order_type_id' => 2, 'is_available' => true],
        ]);

        $item->load('menuChannelStatuses');

        return response()->json($this->format($item), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = MenuItem::where('item_id', $id)->firstOrFail();

        $data = $request->validate([
            'unit_cost'    => 'sometimes|numeric|min:0',
            'is_published' => 'sometimes|boolean',
            'is_archived'  => 'sometimes|boolean',
        ]);

        $item->update($data);

        // Sync channel availability with is_published if toggling publish
        if (isset($data['is_published'])) {
            MenuChannelStatus::where('item_id', $id)
                ->update(['is_available' => $data['is_published']]);
        }

        $item->load('menuChannelStatuses');

        return response()->json($this->format($item));
    }

    private function format(MenuItem $item): array
    {
        return [
            'id'            => $item->item_id,
            'name'          => $item->item_name,
            'price'         => (float) $item->unit_cost,
            'category_name' => $item->category_name,
            'is_published'  => (bool) $item->is_published,
            'is_archived'   => (bool) $item->is_archived,
            'channels'      => $item->menuChannelStatuses->map(fn($cs) => [
                'order_type_id' => $cs->order_type_id,
                'is_available'  => (bool) $cs->is_available,
            ])->values(),
        ];
    }
}
