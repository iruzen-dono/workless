<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookTrigger extends Model
{
    protected $fillable = [
        'workflow_id',
        'token',
        'is_active',
        'last_called_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_called_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
