<?php

namespace App\Jobs;

use App\Models\Execution;
use App\Models\ExecutionLog;
use App\Models\ExecutionStepResult;
use App\Models\Step;
use App\Models\StepConnection;
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
    private ?Execution $execution = null;

    /**
     * Create a new job instance.
     */
    public function __construct(Execution $execution)
    {
        $this->executionId = $execution->id;
    }

    /**
     * Execute the job.
     */
    public function handle(StepRunnerService $stepRunnerService): void
    {
        $this->execution = Execution::find($this->executionId);

        if (! $this->execution) {
            Log::error("DispatcherJob: Execution {$this->executionId} not found.");
            return;
        }

        // Mark execution as running
        $this->execution->update([
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $workflow = $this->execution->workflow;

            if (! $workflow) {
                throw new \RuntimeException('Workflow not found for execution.');
            }

            // Load steps and connections
            $steps = $workflow->steps()->get()->keyBy('id');
            $connections = $workflow->stepConnections()->get();

            if ($steps->isEmpty()) {
                $this->log('warning', 'Workflow has no steps to execute.');
                $this->completeExecution('completed');
                return;
            }

            // Build DAG: compute in-degree for each step
            $inDegree = [];
            foreach ($steps as $stepId => $step) {
                $inDegree[$stepId] = 0;
            }

            // Track outgoing connections per step
            $outgoingConnections = [];
            foreach ($connections as $connection) {
                $sourceId = $connection->source_step_id;
                $targetId = $connection->target_step_id;

                if ($steps->has($targetId)) {
                    $inDegree[$targetId] = ($inDegree[$targetId] ?? 0) + 1;
                }

                if ($steps->has($sourceId)) {
                    $outgoingConnections[$sourceId][] = $connection;
                }
            }

            // Find starting steps (no incoming connections / triggers)
            $startingStepIds = [];
            foreach ($inDegree as $stepId => $degree) {
                if ($degree === 0) {
                    $startingStepIds[] = $stepId;
                }
            }

            if (empty($startingStepIds)) {
                // Cyclic or no starting point — just pick the first step
                $startingStepIds = [$steps->keys()->first()];
                $this->log('warning', 'No starting steps found (all have incoming connections), using first step.');
            }

            // Execute steps in topological order (sequential execution)
            $executed = [];
            $stepResults = [];
            $queue = $startingStepIds;
            $inputData = $this->execution->input_data ?? [];

            while (! empty($queue)) {
                $currentStepId = array_shift($queue);
                $currentStep = $steps->get($currentStepId);

                if (! $currentStep || isset($executed[$currentStepId])) {
                    continue;
                }

                // Check if all dependencies are satisfied
                $dependencies = $connections->where('target_step_id', $currentStepId);
                $allDepsExecuted = true;
                foreach ($dependencies as $dep) {
                    if (! isset($executed[$dep->source_step_id])) {
                        $allDepsExecuted = false;
                        break;
                    }
                }

                if (! $allDepsExecuted) {
                    // Re-queue at the end
                    $queue[] = $currentStepId;
                    continue;
                }

                // Execute this step
                $result = $this->executeStep($currentStep, $stepRunnerService, $inputData);
                $executed[$currentStepId] = true;
                $stepResults[$currentStepId] = $result;

                // If step failed and it's not a condition (condition "failure" is just false), mark execution failed
                if (! $result['success'] && $currentStep->step_type !== 'condition') {
                    throw new \RuntimeException(
                        "Step '{$currentStep->label}' (type: {$currentStep->step_type}) failed: " . ($result['error'] ?? 'Unknown error')
                    );
                }

                // Pass output as input to next steps
                if (isset($result['data'])) {
                    $inputData = array_merge($inputData, $result['data']);
                } else {
                    $inputData[$currentStep->id] = $result;
                }

                // Queue next steps
                $nextConnections = $outgoingConnections[$currentStepId] ?? [];
                foreach ($nextConnections as $connection) {
                    $targetId = $connection->target_step_id;
                    if (! isset($executed[$targetId]) && $steps->has($targetId)) {
                        // Check condition expression if present
                        if (! empty($connection->condition_expression)) {
                            $conditionMet = $this->evaluateCondition(
                                $connection->condition_expression,
                                $stepResults[$currentStepId] ?? []
                            );
                            if (! $conditionMet) {
                                $this->log('info', "Skipping step {$targetId} due to condition on connection {$connection->id}.");
                                continue;
                            }
                        }
                        $queue[] = $targetId;
                    }
                }
            }

            // Check if all steps completed
            $failedSteps = $steps->filter(fn ($s) => isset($stepResults[$s->id]) && ! $stepResults[$s->id]['success']);
            if ($failedSteps->isNotEmpty()) {
                throw new \RuntimeException('Some steps failed during execution.');
            }

            $this->completeExecution('completed');
        } catch (\Exception $e) {
            $this->log('error', 'Execution failed: ' . $e->getMessage());
            $this->completeExecution('failed', $e->getMessage());
        }
    }

    /**
     * Execute a single step and record its result.
     */
    private function executeStep(Step $step, StepRunnerService $runnerService, array $inputData): array
    {
        $this->log('info', "Starting step: {$step->label} ({$step->step_type})", ['step_id' => $step->id]);

        // Create or update ExecutionStepResult
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

    /**
     * Evaluate a condition expression from a connection.
     */
    private function evaluateCondition(array $condition, array $stepOutput): bool
    {
        // Default: if no condition, always pass
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

    /**
     * Log a message for this execution.
     */
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
            // Don't let logging failure crash the execution
            Log::warning('Failed to write execution log: ' . $e->getMessage());
        }
    }

    /**
     * Complete the execution with the given status.
     */
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
