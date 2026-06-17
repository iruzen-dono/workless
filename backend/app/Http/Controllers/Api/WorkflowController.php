<?php

namespace App\Http\Controllers\Api;

use App\Jobs\DispatcherJob;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\Execution;
use App\Models\Step;
use App\Models\StepConnection;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WorkflowController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $query = Workflow::where('workspace_id', $workspace->id);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $workflows = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json($workflows);
    }

    public function store(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,active,paused,archived'],
            'tags' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $workflow = Workflow::create([
            'workspace_id' => $workspace->id,
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? 'draft',
            'tags' => $request->tags,
        ]);

        return response()->json([
            'message' => 'Workflow created.',
            'data' => $workflow,
        ], 201);
    }

    public function show(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $workflow->load([
            'steps',
            'stepConnections',
            'versions' => fn ($q) => $q->latest()->limit(10),
        ]);

        return response()->json(['data' => $workflow]);
    }

    public function update(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,active,paused,archived'],
            'tags' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $workflow->update($request->only([
            'name', 'description', 'status', 'tags',
        ]));

        return response()->json([
            'message' => 'Workflow updated.',
            'data' => $workflow->fresh(),
        ]);
    }

    public function destroy(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $workflow->update(['status' => 'archived']);

        return response()->json(['message' => 'Workflow archived.']);
    }

    public function deploy(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'definition' => ['sometimes', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        // Build definition from current steps and connections if not provided
        $definition = $request->definition ?? [
            'steps' => $workflow->steps->toArray(),
            'connections' => $workflow->stepConnections->toArray(),
        ];

        // Determine next version number
        $latestVersion = $workflow->versions()->latest('version_number')->first();
        $nextVersion = $latestVersion ? $latestVersion->version_number + 1 : 1;

        $version = WorkflowVersion::create([
            'workflow_id' => $workflow->id,
            'version_number' => $nextVersion,
            'definition' => $definition,
        ]);

        // Set workflow to active
        $workflow->update(['status' => 'active']);

        return response()->json([
            'message' => 'Workflow deployed.',
            'data' => $version,
        ], 201);
    }

    public function execute(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        // Find the latest active version
        $version = $workflow->versions()->latest('version_number')->first();

        $execution = Execution::create([
            'workflow_id' => $workflow->id,
            'workflow_version_id' => $version?->id,
            'triggered_by' => 'manual',
            'status' => 'pending',
            'input_data' => $request->input('input_data', $request->input('input', [])),
        ]);

        // Dispatch the execution job
        DispatcherJob::dispatch($execution);

        return response()->json([
            'message' => 'Execution created.',
            'data' => $execution,
        ], 201);
    }

    public function clone(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        // Clone the workflow
        $clone = Workflow::create([
            'workspace_id' => $workspace->id,
            'name' => $workflow->name . ' (copy)',
            'description' => $workflow->description,
            'status' => 'draft',
            'tags' => $workflow->tags,
        ]);

        // Clone all steps
        $stepIdMap = []; // old_id => new_id
        foreach ($workflow->steps as $step) {
            $newStep = Step::create([
                'workflow_id' => $clone->id,
                'step_type' => $step->step_type,
                'config' => $step->config,
                'position_x' => $step->position_x,
                'position_y' => $step->position_y,
                'label' => $step->label,
            ]);
            $stepIdMap[$step->id] = $newStep->id;
        }

        // Clone step connections
        foreach ($workflow->stepConnections as $connection) {
            $newSourceId = $stepIdMap[$connection->source_step_id] ?? null;
            $newTargetId = $stepIdMap[$connection->target_step_id] ?? null;
            if ($newSourceId && $newTargetId) {
                StepConnection::create([
                    'workflow_id' => $clone->id,
                    'source_step_id' => $newSourceId,
                    'target_step_id' => $newTargetId,
                    'label' => $connection->label,
                    'condition_expression' => $connection->condition_expression,
                ]);
            }
        }

        $clone->load(['steps', 'stepConnections']);

        return response()->json([
            'message' => 'Workflow duplicated.',
            'data' => $clone,
        ], 201);
    }

    public function export(Request $request, Workflow $workflow): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $workflow->load(['steps', 'stepConnections']);

        return response()->json([
            'data' => [
                'name' => $workflow->name,
                'description' => $workflow->description,
                'tags' => $workflow->tags,
                'steps' => $workflow->steps->map(fn ($s) => [
                    'step_type' => $s->step_type,
                    'config' => $s->config,
                    'position_x' => $s->position_x,
                    'position_y' => $s->position_y,
                    'label' => $s->label,
                ]),
                'connections' => $workflow->stepConnections->map(fn ($c) => [
                    'source_step_index' => $workflow->steps->search(fn ($s) => $s->id === $c->source_step_id),
                    'target_step_index' => $workflow->steps->search(fn ($s) => $s->id === $c->target_step_id),
                    'label' => $c->label,
                    'condition_expression' => $c->condition_expression,
                ]),
            ],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'steps' => 'required|array|min:1',
            'steps.*.step_type' => 'required|string',
            'steps.*.config' => 'nullable|array',
            'steps.*.label' => 'nullable|string',
            'connections' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        // Create the workflow
        $workflow = Workflow::create([
            'workspace_id' => $workspace->id,
            'name' => $request->name,
            'description' => $request->description ?? '',
            'status' => 'draft',
            'tags' => $request->tags,
        ]);

        // Create steps and track mapping
        $stepIdMap = [];
        foreach ($request->steps as $i => $stepData) {
            $step = Step::create([
                'workflow_id' => $workflow->id,
                'step_type' => $stepData['step_type'],
                'config' => $stepData['config'] ?? [],
                'position_x' => $stepData['position_x'] ?? ($i * 50),
                'position_y' => $stepData['position_y'] ?? ($i * 100),
                'label' => $stepData['label'] ?? $stepData['step_type'],
            ]);
            $stepIdMap[$i] = $step->id;
        }

        // Create connections
        foreach ($request->connections ?? [] as $conn) {
            $sourceId = $stepIdMap[$conn['source_step_index']] ?? null;
            $targetId = $stepIdMap[$conn['target_step_index']] ?? null;
            if ($sourceId && $targetId) {
                StepConnection::create([
                    'workflow_id' => $workflow->id,
                    'source_step_id' => $sourceId,
                    'target_step_id' => $targetId,
                    'label' => $conn['label'] ?? null,
                    'condition_expression' => $conn['condition_expression'] ?? null,
                ]);
            }
        }

        $workflow->load(['steps', 'stepConnections']);

        return response()->json([
            'message' => 'Workflow imported.',
            'data' => $workflow,
        ], 201);
    }
}
