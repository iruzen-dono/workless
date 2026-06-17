<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StepConnection extends Model
{
    protected $fillable = [
        'workflow_id',
        'source_step_id',
        'target_step_id',
        'source_port',
        'target_port',
        'condition_expression',
    ];

    protected function casts(): array
    {
        return [
            'condition_expression' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function sourceStep(): BelongsTo
    {
        return $this->belongsTo(Step::class, 'source_step_id');
    }

    public function targetStep(): BelongsTo
    {
        return $this->belongsTo(Step::class, 'target_step_id');
    }
}
