<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\Workflow;
use App\Models\WebhookTrigger;
use App\Models\WorkflowVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    private WebhookTrigger $activeWebhook;
    private WebhookTrigger $inactiveWebhook;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake the queue to prevent DispatcherJob from running synchronously
        Bus::fake();

        $workspace = Workspace::factory()->create();
        $workflow = Workflow::factory()->create([
            'workspace_id' => $workspace->id,
            'status' => 'active',
        ]);

        // Create a version so the workflow can be executed
        WorkflowVersion::factory()->create([
            'workflow_id' => $workflow->id,
            'version_number' => 1,
        ]);

        $this->activeWebhook = WebhookTrigger::create([
            'workflow_id' => $workflow->id,
            'token' => 'valid-test-token-123',
            'is_active' => true,
        ]);

        $otherWorkflow = Workflow::factory()->create([
            'workspace_id' => $workspace->id,
            'status' => 'active',
        ]);

        $this->inactiveWebhook = WebhookTrigger::create([
            'workflow_id' => $otherWorkflow->id,
            'token' => 'inactive-token-456',
            'is_active' => false,
        ]);
    }

    public function test_webhook_with_valid_token_returns_accepted(): void
    {
        $response = $this->postJson("/api/webhook/{$this->activeWebhook->token}", [
            'event' => 'user.created',
            'user' => [
                'id' => 42,
                'email' => 'user@example.com',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'accepted',
            ])
            ->assertJsonStructure([
                'status',
                'execution_id',
            ]);

        // Assert an execution was created
        $this->assertDatabaseHas('executions', [
            'workflow_id' => $this->activeWebhook->workflow_id,
            'triggered_by' => 'webhook',
            'status' => 'pending',
        ]);
    }

    public function test_webhook_with_invalid_token_returns_not_found(): void
    {
        $response = $this->postJson('/api/webhook/nonexistent-token', [
            'event' => 'test',
        ]);

        $response->assertStatus(404);
    }

    public function test_webhook_with_inactive_token_returns_not_found(): void
    {
        $response = $this->postJson("/api/webhook/{$this->inactiveWebhook->token}", [
            'event' => 'test',
        ]);

        $response->assertStatus(404);
    }

    public function test_webhook_endpoint_is_public_no_auth_required(): void
    {
        // No auth header
        $response = $this->postJson("/api/webhook/{$this->activeWebhook->token}", [
            'test' => 'data',
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'accepted']);
    }

    public function test_webhook_saves_input_data(): void
    {
        $response = $this->postJson("/api/webhook/{$this->activeWebhook->token}", [
            'order_id' => 12345,
            'customer' => 'John Doe',
            'items' => ['item1', 'item2'],
        ]);

        $response->assertStatus(200);

        $executionId = $response->json('execution_id');
        $this->assertNotNull($executionId);

        // Verify the input data was saved
        $this->assertDatabaseHas('executions', [
            'id' => $executionId,
        ]);
    }

    public function test_webhook_updates_last_called_at(): void
    {
        $this->assertNull($this->activeWebhook->last_called_at);

        $this->postJson("/api/webhook/{$this->activeWebhook->token}", [
            'event' => 'test',
        ]);

        $this->activeWebhook->refresh();
        $this->assertNotNull($this->activeWebhook->last_called_at);
    }
}
