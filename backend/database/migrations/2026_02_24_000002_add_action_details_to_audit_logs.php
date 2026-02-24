<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('action', 100)->nullable()->after('action_describe');
            $table->text('details')->nullable()->after('action');
            $table->string('user_name', 100)->nullable()->after('details');
            $table->string('role', 50)->nullable()->after('user_name');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['action', 'details', 'user_name', 'role']);
        });
    }
};
