<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Execution;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExecutionController extends Controller
{
    public function index(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $executions = $workflow->executions()
            ->with('workflowVersion')
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json($executions);
    }

    public function show(Request $request, Execution $execution): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        // Ensure the execution's workflow belongs to the user's workspace
        if ($execution->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $execution->load([
            'workflow',
            'workflowVersion',
            'executionStepResults' => fn ($q) => $q->with('step')->orderBy('started_at'),
            'executionLogs' => fn ($q) => $q->with('step')->orderBy('created_at'),
        ]);

        return response()->json(['data' => $execution]);
    }

    public function cancel(Request $request, Execution $execution): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($execution->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! in_array($execution->status, ['pending', 'running', 'paused'])) {
            return response()->json(['message' => 'Execution cannot be cancelled in its current state.'], 422);
        }

        $execution->update([
            'status' => 'cancelled',
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Execution cancelled.',
            'data' => $execution->fresh(),
        ]);
    }
}
