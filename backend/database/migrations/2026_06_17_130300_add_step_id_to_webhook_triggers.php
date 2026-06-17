<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('webhook_triggers', function (Blueprint $table) {
            $table->foreignId('step_id')->nullable()->constrained('steps')->cascadeOnDelete()->after('workflow_id');
            $table->unique(['workflow_id', 'step_id']);
        });
    }

    public function down(): void
    {
        Schema::table('webhook_triggers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('step_id');
        });
    }
};
