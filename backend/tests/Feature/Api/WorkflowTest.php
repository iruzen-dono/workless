<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\Workflow;
use App\Models\Step;
use App\Models\StepConnection;
use App\Models\WorkflowVersion;
use App\Models\Execution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class WorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $workspace;
    private string $token;
    private array $authHeaders;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake the queue to prevent DispatcherJob from running synchronously
        Bus::fake();

        $this->user = User::factory()->create([
            'password' => bcrypt('Password123!'),
        ]);

        $this->workspace = Workspace::factory()->create();

        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        TeamMember::factory()->create([
            'team_id' => $team->id,
            'user_id' => $this->user->id,
            'role' => 'admin',
        ]);

        $this->token = $this->user->createToken('api-token')->plainTextToken;
        $this->authHeaders = [
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ];
    }

    public function test_can_list_workflows(): void
    {
        Workflow::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->getJson('/api/workflows');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'current_page',
                'per_page',
                'total',
            ]);
    }

    public function test_can_create_workflow(): void
    {
        $response = $this->withHeaders($this->authHeaders)
            ->postJson('/api/workflows', [
                'name' => 'Test Workflow',
                'description' => 'A test workflow',
                'tags' => ['test', 'automation'],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'name', 'description', 'status', 'workspace_id'],
            ]);

        $this->assertDatabaseHas('workflows', [
            'name' => 'Test Workflow',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_can_show_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->getJson("/api/workflows/{$workflow->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'steps', 'step_connections', 'versions'],
            ]);
    }

    public function test_can_update_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Original Name',
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->putJson("/api/workflows/{$workflow->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_can_archive_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'active',
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->deleteJson("/api/workflows/{$workflow->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('workflows', [
            'id' => $workflow->id,
            'status' => 'archived',
        ]);
    }

    public function test_cannot_access_workflow_from_another_workspace(): void
    {
        $otherWorkspace = Workspace::factory()->create();
        $workflow = Workflow::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->getJson("/api/workflows/{$workflow->id}");

        $response->assertStatus(404);
    }

    public function test_can_deploy_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->postJson("/api/workflows/{$workflow->id}/deploy");

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'version_number', 'definition'],
            ]);

        $this->assertDatabaseHas('workflow_versions', [
            'workflow_id' => $workflow->id,
            'version_number' => 1,
        ]);

        $this->assertDatabaseHas('workflows', [
            'id' => $workflow->id,
            'status' => 'active',
        ]);
    }

    public function test_can_execute_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'active',
        ]);

        // Create a version first
        WorkflowVersion::factory()->create([
            'workflow_id' => $workflow->id,
            'version_number' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->postJson("/api/workflows/{$workflow->id}/execute");

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'workflow_id', 'status', 'triggered_by'],
            ]);

        $this->assertDatabaseHas('executions', [
            'workflow_id' => $workflow->id,
            'triggered_by' => 'manual',
            'status' => 'pending',
        ]);
    }

    public function test_can_list_executions_for_workflow(): void
    {
        $workflow = Workflow::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Execution::factory()->count(2)->create([
            'workflow_id' => $workflow->id,
            'triggered_by' => 'manual',
        ]);

        $response = $this->withHeaders($this->authHeaders)
            ->getJson("/api/workflows/{$workflow->id}/executions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
            ]);
    }
}
