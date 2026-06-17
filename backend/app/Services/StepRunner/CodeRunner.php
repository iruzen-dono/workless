<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Log;

class CodeRunner implements StepRunnerInterface
{
    private string $nodePath;
    private string $sandboxPath;

    public function __construct()
    {
        // Full path to Node.js — avoids Windows PATH resolution issues
        $this->nodePath = config('workless.node_path', 'C:\\Program Files\\nodejs\\node.exe');
        $this->sandboxPath = config('workless.sandbox_path', resource_path('js/sandbox.cjs'));
    }

    public function run(array $input, array $config, array $step = []): array
    {
        $code = $config['code'] ?? '';
        $timeout = $config['timeout'] ?? 5000;

        if (empty($code)) {
            return [
                'success' => false,
                'error' => 'No code provided',
            ];
        }

        $payload = json_encode([
            'code' => $code,
            'input' => $input,
            'timeout' => min($timeout, 30000),
        ]);

        $startTime = microtime(true);

        // Write payload to temp file — avoids stdin pipe issues on Windows
        $tmpFile = tempnam(sys_get_temp_dir(), 'wl_');
        file_put_contents($tmpFile, $payload);

        $escapedSandbox = escapeshellarg($this->sandboxPath);
        $escapedTmp = escapeshellarg($tmpFile);
        $escapedNode = escapeshellarg($this->nodePath);
        $command = "{$escapedNode} {$escapedSandbox} {$escapedTmp} 2>&1";

        Log::debug("CodeRunner executing Node.js sandbox with temp file", ['node' => $this->nodePath]);

        $stdout = shell_exec($command);

        // Clean up temp file
        if (file_exists($tmpFile)) {
            @unlink($tmpFile);
        }

        $duration = (microtime(true) - $startTime) * 1000;

        if (empty($stdout)) {
            Log::warning('CodeRunner: Node process produced no output', ['command' => $command]);
            return [
                'success' => false,
                'error' => 'Sandbox process error: Empty output',
            ];
        }

        $result = json_decode($stdout, true);

        if (! $result || ! isset($result['success'])) {
            Log::warning('CodeRunner: Invalid sandbox output', ['stdout' => $stdout]);
            return [
                'success' => false,
                'error' => 'Invalid sandbox output: ' . substr($stdout ?: '', 0, 200),
            ];
        }

        $result['duration_ms'] = (int) $duration;

        Log::debug('CodeRunner completed', [
            'success' => $result['success'],
            'duration_ms' => $duration,
        ]);

        return $result;
    }
}
