<?php

namespace App\Services\StepRunner;

interface StepRunnerInterface
{
    public function run(array $input, array $config): array;
}
