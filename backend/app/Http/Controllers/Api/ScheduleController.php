<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $workspace = $request->attributes->get('workspace');

        $schedules = Schedule::whereHas('workflow', function ($q) use ($workspace) {
            $q->where('workspace_id', $workspace->id);
        })->with('workflow:id,name,status')
          ->orderBy('created_at', 'desc')
          ->get();

        return response()->json(['data' => $schedules]);
    }

    public function store(Request $request)
    {
        $workspace = $request->attributes->get('workspace');

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'workflow_id' => 'required|exists:workflows,id',
            'cron_expression' => 'required|string|max:255',
            'timezone' => 'nullable|string|max:64',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        // Verify workflow belongs to workspace
        $workflow = Workflow::findOrFail($request->workflow_id);
        if ($workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Workflow not found in this workspace.'], 404);
        }

        $schedule = Schedule::create([
            'name' => $request->name ?? $workflow->name . ' (scheduled)',
            'description' => $request->description ?? '',
            'workflow_id' => $request->workflow_id,
            'cron_expression' => $request->cron_expression,
            'timezone' => $request->timezone ?? 'UTC',
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'Schedule created.',
            'data' => $schedule->load('workflow:id,name,status'),
        ], 201);
    }

    public function show(Request $request, Schedule $schedule)
    {
        $workspace = $request->attributes->get('workspace');

        if ($schedule->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'data' => $schedule->load('workflow:id,name,status'),
        ]);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $workspace = $request->attributes->get('workspace');

        if ($schedule->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'workflow_id' => 'sometimes|exists:workflows,id',
            'cron_expression' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:64',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        if ($request->has('workflow_id')) {
            $workflow = Workflow::findOrFail($request->workflow_id);
            if ($workflow->workspace_id !== $workspace->id) {
                return response()->json(['message' => 'Workflow not found in this workspace.'], 404);
            }
        }

        $schedule->update($request->only([
            'name', 'description', 'workflow_id',
            'cron_expression', 'timezone', 'is_active',
        ]));

        return response()->json([
            'message' => 'Schedule updated.',
            'data' => $schedule->fresh()->load('workflow:id,name,status'),
        ]);
    }

    public function destroy(Request $request, Schedule $schedule)
    {
        $workspace = $request->attributes->get('workspace');

        if ($schedule->workflow->workspace_id !== $workspace->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted.']);
    }
}
