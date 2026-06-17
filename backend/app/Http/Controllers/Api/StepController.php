<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Step;
use App\Models\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StepController extends Controller
{
    public function index(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $steps = $workflow->steps()->orderBy('position_y')->orderBy('position_x')->get();

        return response()->json(['data' => $steps]);
    }

    public function store(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'step_type' => ['required', 'string', 'max:255'],
            'config' => ['nullable', 'array'],
            'position_x' => ['nullable', 'numeric'],
            'position_y' => ['nullable', 'numeric'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $step = Step::create([
            'workflow_id' => $workflow->id,
            'step_type' => $request->step_type,
            'config' => $request->config ?? [],
            'position_x' => $request->position_x ?? 0,
            'position_y' => $request->position_y ?? 0,
            'label' => $request->label,
        ]);

        return response()->json([
            'message' => 'Step created.',
            'data' => $step,
        ], 201);
    }

    public function update(Request $request, Workflow $workflow, Step $step): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id || $step->workflow_id !== $workflow->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'step_type' => ['sometimes', 'string', 'max:255'],
            'config' => ['nullable', 'array'],
            'position_x' => ['nullable', 'numeric'],
            'position_y' => ['nullable', 'numeric'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $step->update($request->only([
            'step_type', 'config', 'position_x', 'position_y', 'label',
        ]));

        return response()->json([
            'message' => 'Step updated.',
            'data' => $step->fresh(),
        ]);
    }

    public function destroy(Request $request, Workflow $workflow, Step $step): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id || $step->workflow_id !== $workflow->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $step->delete();

        return response()->json(['message' => 'Step deleted.']);
    }
}
