<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentWorkspace
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Get the first team member's team's workspace
        $teamMember = $user->teamMembers()->with('team.workspace')->first();

        if (! $teamMember || ! $teamMember->team || ! $teamMember->team->workspace) {
            return response()->json(['message' => 'No workspace found for this user.'], 404);
        }

        $workspace = $teamMember->team->workspace;

        // Attach workspace to the request attributes
        $request->attributes->set('workspace', $workspace);

        return $next($request);
    }
}
