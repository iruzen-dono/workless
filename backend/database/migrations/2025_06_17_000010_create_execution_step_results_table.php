<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('execution_step_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('execution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('step_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'running', 'completed', 'skipped', 'failed'])->default('pending');
            $table->jsonb('input_data')->nullable();
            $table->jsonb('output_data')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('attempt_number')->default(1);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('execution_step_results');
    }
};
