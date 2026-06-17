<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IntegrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $integrations = Integration::where('workspace_id', $workspace->id)->get();

        // Mask sensitive data — return integrations without the encrypted config
        $integrations->makeHidden(['config_encrypted']);

        return response()->json(['data' => $integrations]);
    }

    public function connect(Request $request, string $type): JsonResponse
    {
        $workspace = $request->attributes->get('workspace');

        $validator = Validator::make($request->all(), [
            'config' => ['required', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $integration = Integration::updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'type' => $type,
            ],
            [
                'config_encrypted' => encrypt(json_encode($request->config)),
            ]
        );

        $integration->makeHidden(['config_encrypted']);

        return response()->json([
            'message' => 'Integration connected.',
            'data' => $integration,
        ], 201);
    }
}
