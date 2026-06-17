<?php

namespace App\Jobs;

use App\Models\Execution;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DispatcherJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Execution $execution,
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // TODO: Implement workflow execution dispatching logic
        // This job will walk through steps, execute them, and handle connections
    }
}
