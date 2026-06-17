<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowVersion extends Model
{
    use HasFactory;
    protected $fillable = [
        'workflow_id',
        'version_number',
        'definition',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'definition' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function executions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Execution::class);
    }
}
