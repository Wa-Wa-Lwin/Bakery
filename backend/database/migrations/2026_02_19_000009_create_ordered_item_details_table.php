<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordered_item_details', function (Blueprint $table) {
            $table->foreignId('ordered_items_id')->constrained('ordered_items', 'ordered_items_id');
            $table->foreignId('add_on_id')->constrained('add_ons', 'add_on_id');
            $table->timestamps();

            $table->primary(['ordered_items_id', 'add_on_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordered_item_details');
    }
};
