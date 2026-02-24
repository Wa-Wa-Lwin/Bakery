<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'item_id';

    protected $fillable = [
        'item_name',
        'unit_cost',
        'category_name',
        'is_published',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost'    => 'decimal:2',
            'is_published' => 'boolean',
            'is_archived'  => 'boolean',
        ];
    }

    public function menuChannelStatuses(): HasMany
    {
        return $this->hasMany(MenuChannelStatus::class, 'item_id', 'item_id');
    }

    public function orderedItems(): HasMany
    {
        return $this->hasMany(OrderedItem::class, 'item_id', 'item_id');
    }
}
