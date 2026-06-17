<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExecutionLog extends Model
{
    protected $fillable = [
        'execution_id',
        'step_id',
        'level',
        'message',
        'data',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'string',
            'data' => 'array',
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
