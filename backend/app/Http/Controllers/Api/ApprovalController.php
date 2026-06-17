<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\DispatcherJob;
use App\Models\ApprovalRequest;
use App\Models\Execution;
use App\Models\Step;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $requests = ApprovalRequest::whereHas('execution.workflow', function ($q) use ($workspace) {
            $q->where('workspace_id', $workspace->id);
        })->with(['execution', 'step', 'approver'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($requests);
    }

    public function pending(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $requests = ApprovalRequest::where('status', 'pending')
            ->whereHas('execution.workflow', function ($q) use ($workspace) {
                $q->where('workspace_id', $workspace->id);
            })
            ->with(['execution', 'step', 'execution.workflow'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $requests]);
    }

    public function respond(Request $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        // Verify workspace access
        if ($approvalRequest->execution->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($approvalRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been responded to.'], 422);
        }

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'note' => 'nullable|string|max:1000',
        ]);

        $decision = $validated['decision'];

        $approvalRequest->update([
            'status' => $decision,
            'approved_by' => $request->user()->id,
            'response_note' => $validated['note'] ?? null,
            'responded_at' => now(),
        ]);

        // Resume execution if approved
        if ($decision === 'approved') {
            $execution = $approvalRequest->execution;
            $execution->update([
                'status' => 'running',
                'resumed_at' => now(),
            ]);

            // Re-dispatch the execution
            DispatcherJob::dispatch($execution);

            return response()->json([
                'message' => 'Approved! Execution resumed.',
                'data' => $approvalRequest->fresh()->load(['execution', 'step']),
            ]);
        }

        // If rejected, mark execution as failed
        $execution = $approvalRequest->execution;
        $execution->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error_message' => 'Step rejected: ' . ($validated['note'] ?? 'No reason provided'),
        ]);

        return response()->json([
            'message' => 'Rejected. Execution terminated.',
            'data' => $approvalRequest->fresh()->load(['execution', 'step']),
        ]);
    }
}
