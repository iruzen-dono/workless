<?php

use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExecutionController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\QueueMonitorController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StepConnectionController;
use App\Http\Controllers\Api\StepController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WebhookTriggerController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Middleware\SetCurrentWorkspace;
use Illuminate\Support\Facades\Route;

// ========== Public Routes ==========
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/webhook/{token}', [WebhookController::class, 'receive']);

// ========== Protected Routes ==========
Route::middleware(['auth:sanctum', SetCurrentWorkspace::class])->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->withoutMiddleware([SetCurrentWorkspace::class]);

    // Workflows
    Route::apiResource('workflows', WorkflowController::class);
    Route::post('/workflows/{workflow}/deploy', [WorkflowController::class, 'deploy']);
    Route::post('/workflows/{workflow}/execute', [WorkflowController::class, 'execute']);
    Route::post('/workflows/{workflow}/clone', [WorkflowController::class, 'clone']);
    Route::get('/workflows/{workflow}/export', [WorkflowController::class, 'export']);
    Route::post('/workflows/import', [WorkflowController::class, 'import']);

    // Steps (nested under workflows)
    Route::apiResource('workflows.steps', StepController::class);

    // Step Connections (nested under workflows)
    Route::get('/workflows/{workflow}/step-connections', [StepConnectionController::class, 'index']);
    Route::post('/workflows/{workflow}/step-connections', [StepConnectionController::class, 'store']);
    Route::delete('/workflows/{workflow}/step-connections/{stepConnection}', [StepConnectionController::class, 'destroy']);

    // Executions
    Route::get('/workflows/{workflow}/executions', [ExecutionController::class, 'index']);
    Route::get('/executions/{execution}', [ExecutionController::class, 'show']);
    Route::post('/executions/{execution}/cancel', [ExecutionController::class, 'cancel']);

    // Integrations
    Route::get('/integrations', [IntegrationController::class, 'index']);
    Route::post('/integrations/{type}/connect', [IntegrationController::class, 'connect']);

    // Schedules
    Route::apiResource('schedules', ScheduleController::class);

    // Queue Monitor
    Route::get('/queue/stats', [QueueMonitorController::class, 'stats']);
    Route::get('/queue/failed', [QueueMonitorController::class, 'failedJobs']);
    Route::post('/queue/failed/{id}/retry', [QueueMonitorController::class, 'retry']);
    Route::delete('/queue/failed/{id}', [QueueMonitorController::class, 'forget']);

    // Webhooks (nested under workflows)
    Route::get('/workflows/{workflow}/webhooks', [WebhookTriggerController::class, 'index']);
    Route::post('/workflows/{workflow}/webhooks', [WebhookTriggerController::class, 'store']);
    Route::post('/webhooks/{webhookTrigger}/regenerate', [WebhookTriggerController::class, 'regenerate']);
    Route::post('/webhooks/{webhookTrigger}/toggle', [WebhookTriggerController::class, 'toggle']);
    Route::delete('/webhooks/{webhookTrigger}', [WebhookTriggerController::class, 'destroy']);

    // Approvals
    Route::get('/approvals', [ApprovalController::class, 'index']);
    Route::get('/approvals/pending', [ApprovalController::class, 'pending']);
    Route::post('/approvals/{approvalRequest}/respond', [ApprovalController::class, 'respond']);
});
