<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Execution extends Model
{
    use HasFactory;
    protected $fillable = [
        'workflow_id',
        'workflow_version_id',
        'triggered_by',
        'status',
        'started_at',
        'completed_at',
        'resumed_at',
        'duration_ms',
        'error_message',
        'input_data',
    ];

    protected function casts(): array
    {
        return [
            'triggered_by' => 'string',
            'status' => 'string',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'resumed_at' => 'datetime',
            'duration_ms' => 'integer',
            'input_data' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    public function executionLogs(): HasMany
    {
        return $this->hasMany(ExecutionLog::class);
    }

    public function executionStepResults(): HasMany
    {
        return $this->hasMany(ExecutionStepResult::class);
    }
}
