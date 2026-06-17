<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkflowVersion>
 */
class WorkflowVersionFactory extends Factory
{
    protected $model = WorkflowVersion::class;

    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'version_number' => fake()->numberBetween(1, 10),
            'definition' => [
                'steps' => [],
                'connections' => [],
            ],
        ];
    }
}
