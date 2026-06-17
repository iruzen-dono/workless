<?php

namespace App\Services\StepRunner;

class DelayRunner implements StepRunnerInterface
{
    public function run(array $input, array $config): array
    {
        $seconds = (int) ($config['delay_seconds'] ?? 0);

        if ($seconds > 0) {
            sleep($seconds);
        }

        return [
            'success' => true,
            'delayed_seconds' => $seconds,
        ];
    }
}
