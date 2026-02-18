<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AddOn extends Model
{
    use HasFactory;

    protected $primaryKey = 'add_on_id';

    protected $fillable = [
        'add_on_item',
        'add_on_price',
    ];

    protected function casts(): array
    {
        return [
            'add_on_price' => 'decimal:2',
        ];
    }

    public function orderedItems(): BelongsToMany
    {
        return $this->belongsToMany(OrderedItem::class, 'ordered_item_details', 'add_on_id', 'ordered_items_id')
            ->withTimestamps();
    }
}
