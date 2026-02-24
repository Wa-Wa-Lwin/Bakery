<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste', function (Blueprint $table) {
            $table->id('waste_id');
            $table->foreignId('staff_id')->constrained('staff', 'staff_id');
            $table->foreignId('item_id')->nullable()->constrained('menu_items', 'item_id')->nullOnDelete();
            $table->string('item_name', 100);
            $table->string('category_name', 30);
            $table->integer('quantity');
            $table->decimal('unit_cost', 10, 2);
            $table->timestamp('waste_datetime');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste');
    }
};
