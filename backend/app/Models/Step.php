<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Step extends Model
{
    protected $fillable = [
        'workflow_id',
        'step_type',
        'config',
        'position_x',
        'position_y',
        'label',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'position_x' => 'float',
            'position_y' => 'float',
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
