<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id('staff_id');
            $table->string('full_name', 100);
            $table->string('access_code', 10)->unique();
            $table->date('dob');
            $table->string('email', 100);
            $table->date('joined_date');
            $table->boolean('is_active')->default(true);
            $table->string('role_name', 30);
            $table->boolean('can_toggle_channel')->default(false);
            $table->boolean('can_waste')->default(false);
            $table->boolean('can_refund')->default(false);
            $table->timestamps();
        });

        DB::statement("ALTER TABLE staff ADD CONSTRAINT chk_staff_name CHECK (full_name REGEXP '^[A-Za-z ]+$')");
        DB::statement("ALTER TABLE staff ADD CONSTRAINT chk_role_name CHECK (role_name REGEXP '^[A-Za-z ]+$')");
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
