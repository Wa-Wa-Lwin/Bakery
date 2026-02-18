<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id('order_id');
            $table->string('order_type_name', 100);
            $table->timestamp('order_created_datetime');
            $table->timestamp('order_updated_datetime')->nullable();
            $table->string('external_ref', 30)->nullable();
            $table->string('status_name', 30);
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables', 'table_id');
            $table->foreignId('created_staff_id')->constrained('staff', 'staff_id');
            $table->foreignId('updated_staff_id')->constrained('staff', 'staff_id');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
