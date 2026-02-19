<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderedItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'ordered_items_id';

    protected $fillable = [
        'order_id',
        'item_id',
        'quantity',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id', 'item_id');
    }

}
