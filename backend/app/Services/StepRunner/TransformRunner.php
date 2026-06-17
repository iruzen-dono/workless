<?php

namespace App\Services\StepRunner;

class TransformRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $operation = $config['operation'] ?? 'json_path';
        $sourceField = $config['source_field'] ?? $config['field'] ?? '';
        $format = $config['format'] ?? '';
        $separator = $config['separator'] ?? ', ';
        $prefix = $config['prefix'] ?? '';
        $suffix = $config['suffix'] ?? '';

        $result = null;

        try {
            switch ($operation) {
                case 'json_path':
                    $result = data_get($input, $sourceField);
                    break;

                case 'concat':
                    $fields = $config['fields'] ?? [];
                    $values = [];
                    foreach ($fields as $field) {
                        $values[] = data_get($input, $field, '');
                    }
                    $result = implode($separator, $values);
                    break;

                case 'format':
                    $template = $config['template'] ?? '';
                    $result = $template;
                    // Replace {{field}} placeholders with actual values
                    foreach ($input as $key => $value) {
                        if (is_string($value) || is_numeric($value)) {
                            $result = str_replace('{{'.$key.'}}', (string) $value, $result);
                        }
                    }
                    break;

                case 'upper':
                    $value = data_get($input, $sourceField, '');
                    $result = is_string($value) ? strtoupper($value) : $value;
                    break;

                case 'lower':
                    $value = data_get($input, $sourceField, '');
                    $result = is_string($value) ? strtolower($value) : $value;
                    break;

                case 'trim':
                    $value = data_get($input, $sourceField, '');
                    $result = is_string($value) ? trim($value) : $value;
                    break;

                case 'prefix_suffix':
                    $value = data_get($input, $sourceField, '');
                    $result = $prefix . (is_string($value) ? $value : '') . $suffix;
                    break;

                default:
                    $result = data_get($input, $sourceField);
                    break;
            }

            return [
                'success' => true,
                'result' => $result,
                'operation' => $operation,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
