<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Waste extends Model
{
    use HasFactory;
    
    protected $table = 'waste';
    protected $primaryKey = 'waste_id';

    protected $fillable = [
        'staff_id',
        'item_id',
        'item_name',
        'category_name',
        'quantity',
        'unit_cost',
        'waste_datetime',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost'       => 'decimal:2',
            'waste_datetime'  => 'datetime',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id', 'item_id');
    }
}
