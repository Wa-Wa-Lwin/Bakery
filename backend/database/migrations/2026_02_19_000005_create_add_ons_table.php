<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('add_ons', function (Blueprint $table) {
            $table->id('add_on_id');
            $table->string('add_on_item', 50);
            $table->decimal('add_on_price', 10, 2);
            $table->timestamps();
        });

        DB::statement("ALTER TABLE add_ons ADD CONSTRAINT chk_add_on_item CHECK (add_on_item REGEXP '^[A-Za-z ]+$')");
    }

    public function down(): void
    {
        Schema::dropIfExists('add_ons');
    }
};
