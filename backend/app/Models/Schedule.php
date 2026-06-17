<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    protected $fillable = [
        'name',
        'description',
        'workflow_id',
        'cron_expression',
        'timezone',
        'is_active',
        'last_run_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_run_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
