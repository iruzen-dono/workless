<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'token',
                    'workspace' => ['id', 'name', 'slug'],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);

        // Should have created a workspace and team
        $this->assertDatabaseHas('workspaces', [
            'name' => "Test User's Workspace",
        ]);

        $this->assertDatabaseHas('teams', [
            'name' => 'Owners',
        ]);
    }

    public function test_user_can_register_with_custom_workspace_name(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Custom User',
            'email' => 'custom@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'workspace_name' => 'My Workspace',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('workspaces', [
            'name' => 'My Workspace',
        ]);
    }

    public function test_registration_fails_with_missing_fields(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_login(): void
    {
        // Create user first
        $user = User::factory()->create([
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user',
                    'token',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_me(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();
        $team = Team::factory()->create(['workspace_id' => $workspace->id]);
        TeamMember::factory()->create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => 'admin',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'team_members',
                ],
            ]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);

        // Token should be deleted
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }
}
