<?php

namespace App\Services\StepRunner;

use Illuminate\Support\Facades\Log;

class CodeRunner implements StepRunnerInterface
{
    private ?string $nodePath = null;
    private ?string $sandboxPath = null;

    public function __construct()
    {
        $this->nodePath = config('workless.node_path', 'node');
        $this->sandboxPath = config('workless.sandbox_path', resource_path('js/sandbox.cjs'));
    }

    public function run(array $input, array $config): array
    {
        $code = $config['code'] ?? '';

        if (empty($code)) {
            return [
                'success' => false,
                'error' => 'No code provided in step configuration.',
            ];
        }

        $timeout = ($config['timeout'] ?? 5) * 1000; // seconds to ms

        $payload = json_encode([
            'code' => $code,
            'input' => $input,
            'timeout' => min($timeout, 30000), // cap at 30s
        ]);

        $nodeBin = $this->nodePath;
        $sandboxFile = $this->sandboxPath;

        // Use stdin to avoid shell escaping issues on Windows
        $escapedSandbox = escapeshellarg($sandboxFile);
        $command = "{$nodeBin} {$escapedSandbox} 2>&1";

        Log::debug("CodeRunner executing with stdin payload");

        $descriptors = [
            0 => ['pipe', 'r'],  // stdin
            1 => ['pipe', 'w'],  // stdout
            2 => ['pipe', 'w'],  // stderr
        ];

        $startTime = microtime(true);
        $process = proc_open($command, $descriptors, $pipes);

        if (! is_resource($process)) {
            return [
                'success' => false,
                'error' => 'Failed to open sandbox process.',
            ];
        }

        // Send payload via stdin
        fwrite($pipes[0], $payload);
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);
        $duration = (microtime(true) - $startTime) * 1000;

        if ($exitCode !== 0 || empty($stdout)) {
            Log::warning('CodeRunner: Process error', ['exit' => $exitCode, 'stderr' => $stderr]);
            return [
                'success' => false,
                'error' => 'Sandbox process error: ' . ($stderr ?: 'Unknown error'),
            ];
        }

        $result = json_decode($stdout, true);

        if (! $result || ! isset($result['success'])) {
            Log::warning('CodeRunner: Invalid sandbox output', ['stdout' => $stdout, 'stderr' => $stderr]);
            return [
                'success' => false,
                'error' => 'Invalid sandbox output: ' . substr($stdout ?: $stderr, 0, 200),
            ];
        }

        Log::info("CodeRunner completed in {$duration}ms.", [
            'success' => $result['success'],
        ]);

        return [
            'success' => $result['success'],
            'data' => $result['data'] ?? null,
            'error' => $result['error'] ?? null,
            'duration_ms' => (int) $duration,
        ];
    }
}
