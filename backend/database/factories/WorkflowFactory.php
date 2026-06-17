<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Workflow>
 */
class WorkflowFactory extends Factory
{
    protected $model = Workflow::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['draft', 'active', 'paused']),
            'tags' => fake()->randomElements(['api', 'email', 'cron', 'test', 'production'], fake()->numberBetween(0, 3)),
        ];
    }
}
