<?php

namespace Tests\Unit;

use App\Services\StepRunner\HttpRequestRunner;
use App\Services\StepRunner\ConditionRunner;
use App\Services\StepRunner\DelayRunner;
use App\Services\StepRunner\TransformRunner;
use App\Services\StepRunner\ErrorHandlerRunner;
use App\Services\StepRunner\CodeRunner;
use App\Services\StepRunner\ApprovalRunner;
use App\Services\StepRunner\LoopRunner;
use App\Services\StepRunner\StepRunnerService;
use App\Services\StepRunner\StepRunnerInterface;
use Tests\TestCase;

class StepRunnerTest extends TestCase
{
    private StepRunnerService $stepRunnerService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stepRunnerService = new StepRunnerService();
    }

    public function test_condition_runner_equal(): void
    {
        $runner = new ConditionRunner();
        $config = [
            'field' => 'data.status',
            'operator' => '==',
            'value' => 'active',
        ];
        $input = ['data' => ['status' => 'active']];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertTrue($result['result']);
    }

    public function test_condition_runner_not_equal(): void
    {
        $runner = new ConditionRunner();
        $config = [
            'field' => 'data.status',
            'operator' => '!=',
            'value' => 'inactive',
        ];
        $input = ['data' => ['status' => 'active']];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertTrue($result['result']);
    }

    public function test_condition_runner_no_match(): void
    {
        $runner = new ConditionRunner();
        $config = [
            'field' => 'data.status',
            'operator' => '==',
            'value' => 'inactive',
        ];
        $input = ['data' => ['status' => 'active']];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertFalse($result['result']);
    }

    public function test_delay_runner_returns_correct_seconds(): void
    {
        $runner = new DelayRunner();
        $config = ['delay_seconds' => 0]; // test with 0 to avoid sleeping
        $input = [];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertEquals(0, $result['delayed_seconds']);
    }

    public function test_delay_runner_defaults_to_zero(): void
    {
        $runner = new DelayRunner();
        $config = [];
        $input = [];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertEquals(0, $result['delayed_seconds']);
    }

    public function test_transform_runner_json_path(): void
    {
        $runner = new TransformRunner();
        $config = [
            'operation' => 'json_path',
            'source_field' => 'user.name',
        ];
        $input = ['user' => ['name' => 'Alice']];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertEquals('Alice', $result['result']);
    }

    public function test_transform_runner_format(): void
    {
        $runner = new TransformRunner();
        $config = [
            'operation' => 'format',
            'template' => 'Hello {{name}}!',
        ];
        $input = ['name' => 'World'];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertEquals('Hello World!', $result['result']);
    }

    public function test_error_handler_catches_error(): void
    {
        $runner = new ErrorHandlerRunner();
        $input = ['_error' => ['message' => 'Something went wrong', 'step_label' => 'HTTP Step', 'step_type' => 'http_request']];

        $result = $runner->run($input, $config = []);
        $this->assertTrue($result['success']);
        $this->assertTrue($result['data']['caught_error']);
        $this->assertEquals('Something went wrong', $result['data']['error_message']);
    }

    public function test_approval_runner_requires_approval(): void
    {
        $runner = new ApprovalRunner();
        $config = [
            'message' => 'Approve this step?',
            'approval_options' => 'single',
        ];
        $input = [];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['approval_required']);
        $this->assertEquals('Approve this step?', $result['approval_message']);
    }

    public function test_loop_runner_continues_within_max(): void
    {
        $runner = new LoopRunner();
        $config = ['max_iterations' => 3];
        $input = ['_loop_iteration' => 1];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertFalse($result['loop_complete']);
        $this->assertEquals(1, $result['data']['_loop_iteration']);
    }

    public function test_loop_runner_completes_at_max(): void
    {
        $runner = new LoopRunner();
        $config = ['max_iterations' => 3];
        $input = ['_loop_iteration' => 4];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertTrue($result['loop_complete']);
        $this->assertEquals('max_iterations', $result['data']['_loop_exit_reason']);
    }

    public function test_loop_runner_condition_met(): void
    {
        $runner = new LoopRunner();
        $config = [
            'max_iterations' => 10,
            'condition_field' => 'status',
            'condition_operator' => '==',
            'condition_value' => 'done',
        ];
        $input = ['_loop_iteration' => 3, 'status' => 'done'];

        $result = $runner->run($input, $config);
        $this->assertTrue($result['success']);
        $this->assertTrue($result['loop_complete']);
        $this->assertEquals('condition_met', $result['data']['_loop_exit_reason']);
    }

    public function test_step_runner_service_throws_for_unknown_type(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->stepRunnerService->run('nonexistent_type', [], []);
    }

    public function test_step_runner_service_registers_new_runner(): void
    {
        $mockRunner = new class implements StepRunnerInterface {
            public function run(array $input, array $config): array
            {
                return ['success' => true, 'custom' => true];
            }
        };

        $this->stepRunnerService->register('custom_type', $mockRunner);
        $result = $this->stepRunnerService->run('custom_type', [], []);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['custom']);
    }

    public function test_code_runner_requires_code(): void
    {
        $runner = new CodeRunner();
        $result = $runner->run([], []);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('No code', $result['error']);
    }
}
