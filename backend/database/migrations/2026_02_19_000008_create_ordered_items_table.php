<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordered_items', function (Blueprint $table) {
            $table->id('ordered_items_id');
            $table->foreignId('order_id')->constrained('orders', 'order_id');
            $table->foreignId('item_id')->constrained('menu_items', 'item_id');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordered_items');
    }
};
