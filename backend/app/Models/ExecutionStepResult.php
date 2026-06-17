<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExecutionStepResult extends Model
{
    protected $fillable = [
        'execution_id',
        'step_id',
        'status',
        'input_data',
        'output_data',
        'started_at',
        'completed_at',
        'attempt_number',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'input_data' => 'array',
            'output_data' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'attempt_number' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function execution(): BelongsTo
    {
        return $this->belongsTo(Execution::class);
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(Step::class);
    }
}
