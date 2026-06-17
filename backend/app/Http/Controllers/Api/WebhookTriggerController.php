<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Step;
use App\Models\WebhookTrigger;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WebhookTriggerController extends Controller
{
    public function index(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $triggers = $workflow->webhookTriggers()->with('step')->get();

        return response()->json(['data' => $triggers]);
    }

    public function store(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'step_id' => 'nullable|exists:steps,id',
        ]);

        // Check if a webhook already exists for this workflow/step
        $existing = $workflow->webhookTriggers()
            ->where('step_id', $validated['step_id'] ?? null)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Webhook already exists.',
                'data' => $existing,
            ]);
        }

        $trigger = WebhookTrigger::create([
            'workflow_id' => $workflow->id,
            'step_id' => $validated['step_id'] ?? null,
            'token' => Str::random(32),
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Webhook created.',
            'data' => $trigger,
        ], 201);
    }

    public function regenerate(Request $request, WebhookTrigger $webhookTrigger): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($webhookTrigger->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $webhookTrigger->update(['token' => Str::random(32)]);

        return response()->json([
            'message' => 'Webhook token regenerated.',
            'data' => $webhookTrigger->fresh(),
        ]);
    }

    public function toggle(Request $request, WebhookTrigger $webhookTrigger): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($webhookTrigger->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $webhookTrigger->update(['is_active' => ! $webhookTrigger->is_active]);

        return response()->json([
            'message' => $webhookTrigger->is_active ? 'Webhook activated.' : 'Webhook deactivated.',
            'data' => $webhookTrigger->fresh(),
        ]);
    }

    public function destroy(Request $request, WebhookTrigger $webhookTrigger): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($webhookTrigger->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $webhookTrigger->delete();

        return response()->json(['message' => 'Webhook deleted.']);
    }
}
