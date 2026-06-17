<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\Execution;
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
        ]);

        // TODO: dispatch DispatcherJob here once queue is configured
        // DispatcherJob::dispatch($execution);

        return response()->json([
            'message' => 'Execution created.',
            'data' => $execution,
        ], 201);
    }
}
