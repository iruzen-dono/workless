<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('step_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_step_id')->constrained('steps')->cascadeOnDelete();
            $table->foreignId('target_step_id')->constrained('steps')->cascadeOnDelete();
            $table->string('source_port')->nullable();
            $table->string('target_port')->nullable();
            $table->jsonb('condition_expression')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('step_connections');
    }
};
