<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $primaryKey = 'order_id';

    protected $fillable = [
        'order_type_name',
        'order_created_datetime',
        'order_updated_datetime',
        'external_ref',
        'customer_name',
        'status_name',
        'table_id',
        'created_staff_id',
        'updated_staff_id',
    ];

    protected function casts(): array
    {
        return [
            'order_created_datetime' => 'datetime',
            'order_updated_datetime' => 'datetime',
        ];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id', 'table_id');
    }

    public function createdByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'created_staff_id', 'staff_id');
    }

    public function updatedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'updated_staff_id', 'staff_id');
    }

    public function orderedItems(): HasMany
    {
        return $this->hasMany(OrderedItem::class, 'order_id', 'order_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'order_id', 'order_id');
    }
}
