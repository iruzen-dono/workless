<?php

namespace App\Services\StepRunner;

use App\Models\ApprovalRequest;
use Illuminate\Support\Facades\Log;

class ApprovalRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $message = $config['message'] ?? 'Do you approve this action?';
        $approvalOptions = $config['approval_options'] ?? ['approve', 'reject'];

        // Check if there's an existing approval request for this step/execution
        // The execution_id is NOT available in the runner — we need it from context
        // This runner creates/signals that approval is needed

        Log::info('ApprovalRunner: Approval requested', [
            'message' => $message,
            'options' => $approvalOptions,
        ]);

        return [
            'success' => true,
            'status' => 'pending_approval',
            'data' => [
                'message' => $message,
                'options' => $approvalOptions,
                'input_snapshot' => $input,
            ],
            'approval_required' => true,
            'approval_message' => $message,
        ];
    }
}
