<?php

namespace App\Console\Commands;

use App\Jobs\DispatcherJob;
use App\Models\Execution;
use App\Models\Schedule;
use Cron\CronExpression;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CheckSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'schedule:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check all active schedules and dispatch workflows whose cron expression matches the current time.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking schedules...');

        $now = Carbon::now();
        $schedules = Schedule::where('is_active', true)
            ->with('workflow')
            ->get();

        $dispatched = 0;

        foreach ($schedules as $schedule) {
            if (! $schedule->workflow) {
                $this->warn("Schedule #{$schedule->id} has no associated workflow, skipping.");
                continue;
            }

            try {
                $cron = new CronExpression($schedule->cron_expression);
                $timezone = $schedule->timezone ?: 'UTC';
                $scheduleTime = Carbon::now($timezone);

                if (! $cron->isDue($scheduleTime)) {
                    continue;
                }

                // Check if there's already an execution triggered by this schedule within the last minute
                $recentExecution = Execution::where('workflow_id', $schedule->workflow_id)
                    ->where('triggered_by', 'schedule')
                    ->where('created_at', '>=', Carbon::now()->subMinute())
                    ->exists();

                if ($recentExecution) {
                    $this->line("Schedule #{$schedule->id}: workflow already triggered recently, skipping.");
                    continue;
                }

                // Find the latest deployed version
                $version = $schedule->workflow->versions()->latest('version_number')->first();

                $execution = Execution::create([
                    'workflow_id' => $schedule->workflow->id,
                    'workflow_version_id' => $version?->id,
                    'triggered_by' => 'schedule',
                    'status' => 'pending',
                    'input_data' => [],
                ]);

                // Update last_run_at
                $schedule->update(['last_run_at' => $now]);

                // Dispatch the execution job
                DispatcherJob::dispatch($execution);

                $this->info("Dispatched workflow #{$schedule->workflow->id} (schedule #{$schedule->id})");
                $dispatched++;
            } catch (\Exception $e) {
                $this->error("Error checking schedule #{$schedule->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Dispatched {$dispatched} workflow(s).");

        return self::SUCCESS;
    }
}
