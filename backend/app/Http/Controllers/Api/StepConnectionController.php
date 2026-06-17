<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StepConnection;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StepConnectionController extends Controller
{
    public function index(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $connections = $workflow->stepConnections()->with(['sourceStep', 'targetStep'])->get();

        return response()->json(['data' => $connections]);
    }

    public function store(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'source_step_id' => ['required', 'exists:steps,id'],
            'target_step_id' => ['required', 'exists:steps,id', 'different:source_step_id'],
            'source_port' => ['nullable', 'string', 'max:255'],
            'target_port' => ['nullable', 'string', 'max:255'],
            'condition_expression' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        // Ensure both steps belong to this workflow
        $stepIds = $workflow->steps()->pluck('id')->toArray();
        if (! in_array($request->source_step_id, $stepIds) || ! in_array($request->target_step_id, $stepIds)) {
            return response()->json(['message' => 'Steps must belong to this workflow.'], 422);
        }

        $connection = StepConnection::create([
            'workflow_id' => $workflow->id,
            'source_step_id' => $request->source_step_id,
            'target_step_id' => $request->target_step_id,
            'source_port' => $request->source_port,
            'target_port' => $request->target_port,
            'condition_expression' => $request->condition_expression,
        ]);

        return response()->json([
            'message' => 'Connection created.',
            'data' => $connection,
        ], 201);
    }

    public function destroy(Request $request, Workflow $workflow, StepConnection $stepConnection): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id || $stepConnection->workflow_id !== $workflow->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $stepConnection->delete();

        return response()->json(['message' => 'Connection deleted.']);
    }
}
