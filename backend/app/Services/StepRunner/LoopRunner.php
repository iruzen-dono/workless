<?php

namespace App\Services\StepRunner;

class LoopRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $maxIterations = (int) ($config['max_iterations'] ?? 3);
        $currentIteration = (int) ($input['_loop_iteration'] ?? 1);
        $conditionField = $config['condition_field'] ?? '';
        $conditionOperator = $config['condition_operator'] ?? '';
        $conditionValue = $config['condition_value'] ?? '';

        // Check condition-based exit (if a condition is configured)
        if (! empty($conditionField) && $currentIteration > 1) {
            $actualValue = $input[$conditionField] ?? null;
            $conditionMet = false;

            if ($actualValue !== null) {
                switch ($conditionOperator) {
                    case '==':
                        $conditionMet = $actualValue == $conditionValue;
                        break;
                    case '!=':
                        $conditionMet = $actualValue != $conditionValue;
                        break;
                    case '>':
                        $conditionMet = $actualValue > $conditionValue;
                        break;
                    case '<':
                        $conditionMet = $actualValue < $conditionValue;
                        break;
                    case '>=':
                        $conditionMet = $actualValue >= $conditionValue;
                        break;
                    case '<=':
                        $conditionMet = $actualValue <= $conditionValue;
                        break;
                }
            }

            // Condition met: stop looping
            if ($conditionMet) {
                return [
                    'success' => true,
                    'loop_complete' => true,
                    'data' => [
                        '_loop_iteration' => $currentIteration,
                        '_loop_total' => $currentIteration,
                        '_loop_exit_reason' => 'condition_met',
                    ],
                ];
            }
        }

        // Max iterations reached
        if ($currentIteration > $maxIterations) {
            return [
                'success' => true,
                'loop_complete' => true,
                'data' => [
                    '_loop_iteration' => $maxIterations,
                    '_loop_total' => $maxIterations,
                    '_loop_exit_reason' => 'max_iterations',
                ],
            ];
        }

        // Continue looping — increment and pass through
        return [
            'success' => true,
            'loop_complete' => false,
            'data' => [
                '_loop_iteration' => $currentIteration,
                '_loop_total' => $maxIterations,
                '_loop_exit_reason' => 'continuing',
            ],
        ];
    }
}
