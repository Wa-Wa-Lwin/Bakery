<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderedItemDetail extends Model
{
    use HasFactory;

    protected $table = 'ordered_item_details';
    public $incrementing = false;

    protected $fillable = [
        'ordered_items_id',
        'add_on_id',
    ];

    public function orderedItem(): BelongsTo
    {
        return $this->belongsTo(OrderedItem::class, 'ordered_items_id', 'ordered_items_id');
    }

    public function addOn(): BelongsTo
    {
        return $this->belongsTo(AddOn::class, 'add_on_id', 'add_on_id');
    }
}
