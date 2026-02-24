<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderedItem;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * List orders (defaults to today, supports ?period=week|month|year|all).
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', 'today');

        $query = Order::with(['payment', 'orderedItems.menuItem', 'createdByStaff'])
            ->orderByDesc('order_created_datetime');

        $now = now();
        match ($period) {
            'today' => $query->whereDate('order_created_datetime', today()),
            'week'  => $query->where('order_created_datetime', '>=', $now->copy()->subDays(7)),
            'month' => $query->whereYear('order_created_datetime', $now->year)
                             ->whereMonth('order_created_datetime', $now->month),
            'year'  => $query->whereYear('order_created_datetime', $now->year),
            default => null, // 'all' — no filter
        };

        $orders = $query->get()->map(fn($o) => $this->format($o));

        return response()->json($orders);
    }

    /**
     * Create a completed order with its items and payment in one transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'       => 'required|string|max:100',
            'order_type'          => 'required|string|in:takeaway,eat_in',
            'staff_id'            => 'required|integer|exists:staff,staff_id',
            'payment_method'      => 'required|string|in:card,cash,qr',
            'total'               => 'required|numeric|min:0',
            'subtotal'            => 'required|numeric|min:0',
            'vat_amount'          => 'required|numeric|min:0',
            'service_amount'      => 'required|numeric|min:0',
            'items'               => 'required|array|min:1',
            'items.*.item_id'     => 'required|integer|exists:menu_items,item_id',
            'items.*.quantity'    => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data) {
            $now = now();

            $order = Order::create([
                'order_type_name'        => $data['order_type'],
                'order_created_datetime' => $now,
                'order_updated_datetime' => $now,
                'customer_name'          => $data['customer_name'],
                'status_name'            => 'paid',
                'created_staff_id'       => $data['staff_id'],
                'updated_staff_id'       => $data['staff_id'],
            ]);

            foreach ($data['items'] as $line) {
                OrderedItem::create([
                    'order_id' => $order->order_id,
                    'item_id'  => $line['item_id'],
                    'quantity' => $line['quantity'],
                ]);
            }

            Payment::create([
                'order_id'           => $order->order_id,
                'total'              => $data['total'],
                'subtotal'           => $data['subtotal'],
                'vat_amount'         => $data['vat_amount'],
                'service_amount'     => $data['service_amount'],
                'payment_method_name' => $data['payment_method'],
            ]);

            $order->load(['payment', 'orderedItems.menuItem']);

            return response()->json($this->format($order), 201);
        });
    }

    private function format(Order $order): array
    {
        return [
            'order_id'      => $order->order_id,
            'customer_name' => $order->customer_name,
            'order_type'    => $order->order_type_name,
            'status'        => $order->status_name,
            'paid_at'       => $order->order_updated_datetime?->toISOString(),
            'created_at'    => $order->order_created_datetime?->toISOString(),
            'items'         => $order->orderedItems->map(fn($oi) => [
                'item_id'  => $oi->item_id,
                'name'     => $oi->menuItem?->item_name ?? 'Unknown',
                'price'    => $oi->menuItem ? (float) $oi->menuItem->unit_cost : 0,
                'qty'      => $oi->quantity,
            ])->values(),
            'payment' => $order->payment ? [
                'total'          => (float) $order->payment->total,
                'subtotal'       => (float) ($order->payment->subtotal ?? 0),
                'vat_amount'     => (float) ($order->payment->vat_amount ?? 0),
                'service_amount' => (float) ($order->payment->service_amount ?? 0),
                'method'         => $order->payment->payment_method_name,
            ] : null,
        ];
    }
}
