<?php

namespace App\Services\StepRunner;

use InvalidArgumentException;

class StepRunnerService
{
    private array $runners = [];

    public function __construct()
    {
        $this->runners = [
            'http_request' => new HttpRequestRunner(),
            'condition' => new ConditionRunner(),
            'delay' => new DelayRunner(),
            'email' => new EmailRunner(),
            'transform' => new TransformRunner(),
            'error_handler' => new ErrorHandlerRunner(),
            'code' => new CodeRunner(),
        ];
    }

    /**
     * Register a custom runner for a step type.
     */
    public function register(string $type, StepRunnerInterface $runner): void
    {
        $this->runners[$type] = $runner;
    }

    /**
     * Run a step by its type.
     *
     * @param string $type The step type (e.g., 'http_request', 'condition', etc.)
     * @param array $input The input data from previous steps
     * @param array $config The step configuration
     * @return array The result of the step execution
     */
    public function run(string $type, array $input, array $config): array
    {
        $runner = $this->runners[$type] ?? null;

        if (! $runner) {
            throw new InvalidArgumentException("No runner registered for step type: {$type}");
        }

        return $runner->run($input, $config);
    }
}
