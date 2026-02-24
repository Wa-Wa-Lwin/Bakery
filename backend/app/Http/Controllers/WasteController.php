<?php

namespace App\Http\Controllers;

use App\Models\Waste;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WasteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', 'today');

        $query = Waste::with('staff')
            ->orderByDesc('waste_datetime');

        $now = now();
        match ($period) {
            'today' => $query->whereDate('waste_datetime', today()),
            'week'  => $query->where('waste_datetime', '>=', $now->copy()->subDays(7)),
            'month' => $query->whereYear('waste_datetime', $now->year)
                             ->whereMonth('waste_datetime', $now->month),
            'year'  => $query->whereYear('waste_datetime', $now->year),
            default => null, // 'all'
        };

        return response()->json(
            $query->get()->map(fn($w) => $this->format($w))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff_id'      => 'required|integer|exists:staff,staff_id',
            'item_id'       => 'nullable|integer|exists:menu_items,item_id',
            'item_name'     => 'required|string|max:100',
            'category_name' => 'required|string|max:50',
            'quantity'      => 'required|integer|min:1',
            'unit_cost'     => 'required|numeric|min:0',
        ]);

        $waste = Waste::create([
            'staff_id'      => $data['staff_id'],
            'item_id'       => $data['item_id'] ?? null,
            'item_name'     => $data['item_name'],
            'category_name' => $data['category_name'],
            'quantity'      => $data['quantity'],
            'unit_cost'     => $data['unit_cost'],
            'waste_datetime' => now(),
        ]);

        $waste->load('staff');

        return response()->json($this->format($waste), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        Waste::where('waste_id', $id)->firstOrFail()->delete();

        return response()->json(['deleted' => true]);
    }

    private function format(Waste $w): array
    {
        return [
            'id'            => $w->waste_id,
            'item_name'     => $w->item_name,
            'category_name' => $w->category_name,
            'qty'           => $w->quantity,
            'unit_cost'     => (float) $w->unit_cost,
            'recorded_by'   => $w->staff?->full_name ?? 'Unknown',
            'recorded_at'   => $w->waste_datetime?->toISOString(),
        ];
    }
}
