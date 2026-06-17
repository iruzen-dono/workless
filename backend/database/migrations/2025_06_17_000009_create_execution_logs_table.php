<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('execution_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('execution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('step_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('level', ['info', 'warn', 'error', 'debug']);
            $table->text('message');
            $table->jsonb('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('execution_logs');
    }
};
