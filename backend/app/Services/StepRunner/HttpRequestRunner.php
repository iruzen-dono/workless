<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Http;

class HttpRequestRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $method = strtoupper($config['method'] ?? 'GET');
        $url = $config['url'] ?? '';
        $headers = $config['headers'] ?? [];
        $body = $config['body'] ?? null;

        if (empty($url)) {
            return [
                'success' => false,
                'error' => 'URL is required for HTTP request step.',
            ];
        }

        try {
            $request = Http::withHeaders($headers);

            if (in_array($method, ['POST', 'PUT', 'PATCH']) && $body !== null) {
                if (is_string($body)) {
                    // Assume JSON string body
                    $request->withBody($body, 'application/json');
                } else {
                    $request->withBody(json_encode($body), 'application/json');
                }
            }

            $response = $request->send($method, $url);

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
