<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Log;

class ErrorHandlerRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $errorMessage = $input['_error']['message'] ?? 'Unknown error';
        $errorStep = $input['_error']['step_label'] ?? 'Unknown step';
        $errorStepType = $input['_error']['step_type'] ?? 'unknown';

        Log::info("ErrorHandler: Caught failure from step '{$errorStep}' ({$errorStepType}): {$errorMessage}");

        return [
            'success' => true,
            'data' => [
                'caught_error' => true,
                'error_message' => $errorMessage,
                'error_step' => $errorStep,
                'error_step_type' => $errorStepType,
                'handled_at' => now()->toIso8601String(),
            ],
        ];
    }
}
