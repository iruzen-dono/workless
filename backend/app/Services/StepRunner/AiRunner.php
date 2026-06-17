<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Log;

/**
 * AI/LLM Node — structure de base non-fonctionnelle.
 * 
 * Ce runner retourne des données mock en attendant l'intégration
 * réelle des providers (OpenAI, Anthropic, Ollama...).
 */
class AiRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $provider = $config['provider'] ?? 'openai';
        $model = $config['model'] ?? 'gpt-4o-mini';
        $prompt = $config['prompt'] ?? '';

        Log::info('AiRunner: AI step executed (mock mode)', [
            'provider' => $provider,
            'model' => $model,
            'prompt_length' => strlen($prompt),
        ]);

        return [
            'success' => true,
            'data' => [
                'provider' => $provider,
                'model' => $model,
                'response' => '[AI Node — pending provider integration]',
                'usage' => [
                    'prompt_tokens' => 0,
                    'completion_tokens' => 0,
                    'total_tokens' => 0,
                    'cost' => 0,
                ],
            ],
            'message' => 'AI Node executed (mock). Provider integration coming soon.',
        ];
    }
}
