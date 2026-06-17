<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('executions', function (Blueprint $table) {
            $table->json('input_data')->nullable()->after('error_message');
        });
    }

    public function down(): void
    {
        Schema::table('executions', function (Blueprint $table) {
            $table->dropColumn('input_data');
        });
    }
};
