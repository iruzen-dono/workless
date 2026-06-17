<?php

namespace App\Jobs;

use App\Models\Execution;
use App\Models\ExecutionLog;
use App\Models\ExecutionStepResult;
use App\Models\Step;
use App\Models\StepConnection;
use App\Models\ApprovalRequest;
use App\Services\StepRunner\StepRunnerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DispatcherJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $executionId;
    public string $priority = 'default';
    private ?Execution $execution = null;

    public function __construct(Execution $execution)
    {
        $this->executionId = $execution->id;
    }

    public function handle(StepRunnerService $stepRunnerService): void
    {
        $this->execution = Execution::find($this->executionId);

        if (! $this->execution) {
            Log::error("DispatcherJob: Execution {$this->executionId} not found.");
            return;
        }

        $this->execution->update([
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $workflow = $this->execution->workflow;
            if (! $workflow) {
                throw new \RuntimeException('Workflow not found for execution.');
            }

            $steps = $workflow->steps()->get()->keyBy('id');
            $connections = $workflow->stepConnections()->get();

            if ($steps->isEmpty()) {
                $this->log('warning', 'Workflow has no steps to execute.');
                $this->completeExecution('completed');
                return;
            }

            // Index connections by type for fast lookup
            $successConnections = $connections->where('type', 'success')->groupBy('source_step_id');
            $errorConnections = $connections->where('type', 'error')->groupBy('source_step_id');

            // Build DAG (only forward edges for in-degree)
            $inDegree = [];
            foreach ($steps as $stepId => $step) {
                $inDegree[$stepId] = 0;
            }
            foreach ($successConnections as $sourceId => $conns) {
                foreach ($conns as $conn) {
                    if ($steps->has($conn->target_step_id)) {
                        $inDegree[$conn->target_step_id] = ($inDegree[$conn->target_step_id] ?? 0) + 1;
                    }
                }
            }

            // Starting steps: no incoming success connections
            $startingStepIds = [];
            foreach ($inDegree as $stepId => $degree) {
                if ($degree === 0) {
                    $startingStepIds[] = $stepId;
                }
            }

            if (empty($startingStepIds)) {
                $startingStepIds = [$steps->keys()->first()];
                $this->log('warning', 'No starting steps found, using first step.');
            }

            // Main execution loop
            $executed = [];
            $stepResults = [];
            $queue = $startingStepIds;
            $inputData = $this->execution->input_data ?? [];
            $hasErrors = false;

            while (! empty($queue)) {
                $currentStepId = array_shift($queue);
                $currentStep = $steps->get($currentStepId);

                if (! $currentStep || isset($executed[$currentStepId])) {
                    continue;
                }

                // Check dependencies (only success connections)
                $deps = $connections->where('target_step_id', $currentStepId)->where('type', 'success');
                $allDepsExecuted = true;
                foreach ($deps as $dep) {
                    if (! isset($executed[$dep->source_step_id])) {
                        $allDepsExecuted = false;
                        break;
                    }
                }
                if (! $allDepsExecuted) {
                    $queue[] = $currentStepId;
                    continue;
                }

                // Execute the step
                $result = $this->executeStep($currentStep, $stepRunnerService, $inputData);
                $executed[$currentStepId] = true;
                $stepResults[$currentStepId] = $result;

                // Handle pending approval — pause execution
                if (! empty($result['approval_required'])) {
                    $this->log('info', "Step '{$currentStep->label}' requires approval — pausing execution.");

                    ApprovalRequest::create([
                        'execution_id' => $this->execution->id,
                        'step_id' => $currentStep->id,
                        'status' => 'pending',
                        'message' => $result['approval_message'] ?? 'Approval required',
                        'input_snapshot' => $inputData,
                    ]);

                    $this->completeExecution('paused');
                    return;
                }

                // Handle step failure
                if (! $result['success'] && $currentStep->step_type !== 'condition') {
                    // Check for error handlers
                    $handlers = $errorConnections[$currentStepId] ?? collect();
                    if ($handlers->isNotEmpty()) {
                        $hasErrors = true;
                        $errorPayload = [
                            '_error' => [
                                'message' => $result['error'] ?? 'Step failed',
                                'step_label' => $currentStep->label,
                                'step_type' => $currentStep->step_type,
                                'step_id' => $currentStep->id,
                            ],
                        ];

                        // Run each error handler
                        foreach ($handlers as $errorConn) {
                            $handlerStep = $steps->get($errorConn->target_step_id);
                            if ($handlerStep && ! isset($executed[$handlerStep->id])) {
                                $this->log('info', "Routing error from '{$currentStep->label}' to error handler '{$handlerStep->label}'");
                                $handlerResult = $this->executeStep($handlerStep, $stepRunnerService, array_merge($inputData, $errorPayload));
                                $executed[$handlerStep->id] = true;
                                $stepResults[$handlerStep->id] = $handlerResult;
                                // Pass handler output as input
                                if (isset($handlerResult['data'])) {
                                    $inputData = array_merge($inputData, $handlerResult['data']);
                                } else {
                                    $inputData[$handlerStep->id] = $handlerResult;
                                }
                            }
                        }

                        // After error handled, continue downstream of error handler if connected
                        foreach ($handlers as $errorConn) {
                            $handlerNext = $successConnections[$errorConn->target_step_id] ?? collect();
                            foreach ($handlerNext as $nextConn) {
                                $nextId = $nextConn->target_step_id;
                                if (! isset($executed[$nextId]) && $steps->has($nextId)) {
                                    $queue[] = $nextId;
                                }
                            }
                        }

                        continue; // Don't process normal next steps for failed step
                    }

                    // No error handler — throw to fail the execution
                    throw new \RuntimeException(
                        "Step '{$currentStep->label}' (type: {$currentStep->step_type}) failed: " . ($result['error'] ?? 'Unknown error')
                    );
                }

                // Merge output data
                if (isset($result['data'])) {
                    $inputData = array_merge($inputData, $result['data']);
                } else {
                    $inputData[$currentStep->id] = $result;
                }

                // Queue next steps via success connections
                $nextConns = $successConnections[$currentStepId] ?? collect();
                foreach ($nextConns as $conn) {
                    $targetId = $conn->target_step_id;
                    if (! isset($executed[$targetId]) && $steps->has($targetId)) {
                        if (! empty($conn->condition_expression)) {
                            $conditionMet = $this->evaluateCondition(
                                $conn->condition_expression,
                                $stepResults[$currentStepId] ?? []
                            );
                            if (! $conditionMet) {
                                $this->log('info', "Skipping step {$targetId} due to condition.");
                                continue;
                            }
                        }
                        $queue[] = $targetId;
                    }
                }
            }

            $this->completeExecution($hasErrors ? 'completed_with_errors' : 'completed');
        } catch (\Exception $e) {
            $this->log('error', 'Execution failed: ' . $e->getMessage());
            $this->completeExecution('failed', $e->getMessage());
        }
    }

    private function executeStep(Step $step, StepRunnerService $runnerService, array $inputData): array
    {
        $this->log('info', "Starting step: {$step->label} ({$step->step_type})", ['step_id' => $step->id]);

        $stepResult = ExecutionStepResult::updateOrCreate(
            [
                'execution_id' => $this->execution->id,
                'step_id' => $step->id,
            ],
            [
                'status' => 'running',
                'input_data' => $inputData,
                'started_at' => now(),
            ]
        );

        try {
            $output = $runnerService->run($step->step_type, $inputData, $step->config ?? []);

            $status = ($output['success'] ?? false) ? 'completed' : 'failed';

            $stepResult->update([
                'status' => $status,
                'output_data' => $output,
                'completed_at' => now(),
            ]);

            $this->log(
                $status === 'completed' ? 'info' : 'warning',
                "Step {$step->label} {$status}.",
                ['step_id' => $step->id, 'output' => $output]
            );

            return $output;
        } catch (\Exception $e) {
            $stepResult->update([
                'status' => 'failed',
                'output_data' => ['error' => $e->getMessage()],
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            $this->log('error', "Step {$step->label} failed with exception: " . $e->getMessage(), [
                'step_id' => $step->id,
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function evaluateCondition(array $condition, array $stepOutput): bool
    {
        if (empty($condition)) {
            return true;
        }

        $field = $condition['field'] ?? null;
        $operator = $condition['operator'] ?? 'equals';
        $value = $condition['value'] ?? null;

        if ($field === null) {
            return true;
        }

        $actualValue = data_get($stepOutput, $field);

        return match ($operator) {
            'equals', '==' => $actualValue == $value,
            'not_equals', '!=' => $actualValue != $value,
            'true' => $actualValue === true || $actualValue === 'true' || $actualValue === 1,
            'false' => $actualValue === false || $actualValue === 'false' || $actualValue === 0,
            default => $actualValue == $value,
        };
    }

    private function log(string $level, string $message, array $data = []): void
    {
        try {
            ExecutionLog::create([
                'execution_id' => $this->execution->id,
                'step_id' => $data['step_id'] ?? null,
                'level' => $level,
                'message' => $message,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to write execution log: ' . $e->getMessage());
        }
    }

    private function completeExecution(string $status, ?string $errorMessage = null): void
    {
        $this->execution->update([
            'status' => $status,
            'completed_at' => now(),
            'duration_ms' => $this->execution->started_at
                ? (int) now()->diffInMilliseconds($this->execution->started_at, true)
                : null,
            'error_message' => $errorMessage,
        ]);

        $this->log('info', "Execution {$status}.");
    }
}
