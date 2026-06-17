<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\DispatcherJob;
use App\Models\Execution;
use App\Models\WebhookTrigger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    /**
     * Receive an incoming webhook trigger.
     *
     * POST /api/webhook/{token}
     * Public route – no auth required.
     */
    public function receive(string $token): JsonResponse
    {
        $webhookTrigger = WebhookTrigger::where('token', $token)
            ->where('is_active', true)
            ->with('workflow')
            ->first();

        if (! $webhookTrigger || ! $webhookTrigger->workflow) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $workflow = $webhookTrigger->workflow;

        // Get the latest deployed version
        $version = $workflow->versions()->latest('version_number')->first();

        // Capture input data from request body
        $inputData = request()->all();

        // Create execution
        $execution = Execution::create([
            'workflow_id' => $workflow->id,
            'workflow_version_id' => $version?->id,
            'triggered_by' => 'webhook',
            'status' => 'pending',
            'input_data' => $inputData,
        ]);

        // Update last_called_at on webhook trigger
        $webhookTrigger->update(['last_called_at' => now()]);

        // Dispatch the execution job
        DispatcherJob::dispatch($execution);

        return response()->json([
            'status' => 'accepted',
            'execution_id' => $execution->id,
        ], 200);
    }
}
