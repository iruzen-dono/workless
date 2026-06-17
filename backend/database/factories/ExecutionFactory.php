<?php

namespace Database\Factories;

use App\Models\Execution;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Execution>
 */
class ExecutionFactory extends Factory
{
    protected $model = Execution::class;

    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'workflow_version_id' => WorkflowVersion::factory(),
            'triggered_by' => fake()->randomElement(['manual', 'webhook', 'schedule']),
            'status' => fake()->randomElement(['pending', 'running', 'completed', 'failed']),
            'started_at' => fake()->optional()->dateTime(),
            'completed_at' => fake()->optional()->dateTime(),
            'duration_ms' => fake()->optional()->numberBetween(100, 30000),
            'error_message' => fake()->optional()->sentence(),
        ];
    }
}
