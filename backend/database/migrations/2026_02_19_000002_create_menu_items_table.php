<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->string('item_name', 100);
            $table->decimal('unit_cost', 10, 2);
            $table->string('category_name', 30);
            $table->timestamps();
        });

        DB::statement("ALTER TABLE menu_items ADD CONSTRAINT chk_category_name CHECK (category_name REGEXP '^[A-Za-z ]+$')");
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
