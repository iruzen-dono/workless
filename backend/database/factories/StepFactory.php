<?php

namespace Database\Factories;

use App\Models\Step;
use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Step>
 */
class StepFactory extends Factory
{
    protected $model = Step::class;

    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'step_type' => fake()->randomElement(['http_request', 'condition', 'delay', 'email', 'transform']),
            'config' => [],
            'position_x' => fake()->numberBetween(0, 800),
            'position_y' => fake()->numberBetween(0, 600),
            'label' => fake()->word(),
        ];
    }
}
