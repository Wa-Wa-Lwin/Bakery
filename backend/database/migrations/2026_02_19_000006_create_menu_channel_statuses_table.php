<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_channel_statuses', function (Blueprint $table) {
            $table->foreignId('item_id')->constrained('menu_items', 'item_id');
            $table->unsignedBigInteger('order_type_id');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->primary(['item_id', 'order_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_channel_statuses');
    }
};
