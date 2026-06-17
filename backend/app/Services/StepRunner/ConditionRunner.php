<?php

namespace App\Services\StepRunner;

class ConditionRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $field = $config['field'] ?? '';
        $operator = $config['operator'] ?? 'equals';
        $value = $config['value'] ?? null;

        $actualValue = data_get($input, $field);

        $result = match ($operator) {
            'equals', '==' => $actualValue == $value,
            'not_equals', '!=' => $actualValue != $value,
            'gt', '>' => $actualValue > $value,
            'gte', '>=' => $actualValue >= $value,
            'lt', '<' => $actualValue < $value,
            'lte', '<=' => $actualValue <= $value,
            'contains' => is_string($actualValue) && str_contains($actualValue, (string) $value),
            'not_contains' => is_string($actualValue) && ! str_contains($actualValue, (string) $value),
            'starts_with' => is_string($actualValue) && str_starts_with($actualValue, (string) $value),
            'ends_with' => is_string($actualValue) && str_ends_with($actualValue, (string) $value),
            'is_empty' => empty($actualValue),
            'is_not_empty' => ! empty($actualValue),
            'in_array' => is_array($value) && in_array($actualValue, $value, true),
            'not_in_array' => is_array($value) && ! in_array($actualValue, $value, true),
            default => false,
        };

        return [
            'success' => true,
            'result' => $result,
            'field' => $field,
            'operator' => $operator,
            'expected' => $value,
            'actual' => $actualValue,
        ];
    }
}
