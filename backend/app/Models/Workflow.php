<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'status',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'tags' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowVersion::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(Step::class);
    }

    public function stepConnections(): HasMany
    {
        return $this->hasMany(StepConnection::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(Execution::class);
    }

    public function webhookTriggers(): HasMany
    {
        return $this->hasMany(WebhookTrigger::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
