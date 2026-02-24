<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff';
    protected $primaryKey = 'staff_id';

    protected $fillable = [
        'full_name',
        'access_code',
        'dob',
        'email',
        'joined_date',
        'is_active',
        'role_name',
        'can_toggle_channel',
        'can_waste',
        'can_refund',
    ];

    // protected $hidden = [
    //     'access_code',
    // ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'joined_date' => 'date',
            'is_active' => 'boolean',
            'can_toggle_channel' => 'boolean',
            'can_waste' => 'boolean',
            'can_refund' => 'boolean',
        ];
    }

    public function createdOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'created_staff_id', 'staff_id');
    }

    public function updatedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'updated_staff_id', 'staff_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'staff_id', 'staff_id');
    }
}
