<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExecutionController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\StepConnectionController;
use App\Http\Controllers\Api\StepController;
use App\Http\Controllers\Api\WebhookController;
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
});
