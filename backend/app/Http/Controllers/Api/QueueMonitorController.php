<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class QueueMonitorController extends Controller
{
    public function stats(): JsonResponse
    {
        $queues = ['high', 'default', 'low'];
        $stats = [];

        foreach ($queues as $queue) {
            $pending = Redis::connection()->llen("queues:{$queue}");
            $delayed = Redis::connection()->zcount("queues:{$queue}:delayed", '-inf', '+inf') ?: 0;
            $reserved = Redis::connection()->zcount("queues:{$queue}:reserved", '-inf', '+inf') ?: 0;
            $total = $pending + $delayed + $reserved;

            $stats[$queue] = [
                'pending' => max(0, $pending),
                'delayed' => max(0, $delayed),
                'reserved' => max(0, $reserved),
                'total' => max(0, $total),
            ];
        }

        // Failed jobs count
        $failedCount = DB::table('failed_jobs')->count();

        // Worker status (check if any php artisan queue:work is running)
        $workerCount = 0;
        if (PHP_OS_FAMILY === 'Windows') {
            exec('tasklist /FI "IMAGENAME eq php.exe" /FO CSV /NH 2>NUL', $output);
            $workerCount = count($output ?? []);
        } else {
            exec('ps aux | grep "artisan queue:work" | grep -v grep | wc -l', $output);
            $workerCount = (int) ($output[0] ?? 0);
        }

        return response()->json([
            'data' => [
                'queues' => $stats,
                'failed_jobs' => $failedCount,
                'active_workers' => max(0, $workerCount),
                'total_queued' => collect($stats)->sum('total'),
            ],
        ]);
    }

    public function failedJobs(Request $request): JsonResponse
    {
        $jobs = DB::table('failed_jobs')
            ->orderBy('failed_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($jobs);
    }

    public function retry(string $id): JsonResponse
    {
        if ($id === 'all') {
            DB::table('failed_jobs')->delete();
            \Artisan::call('queue:retry', ['id' => ['all']]);
            return response()->json(['message' => 'All failed jobs requeued.']);
        }

        $job = DB::table('failed_jobs')->find($id);
        if (! $job) {
            return response()->json(['message' => 'Failed job not found.'], 404);
        }

        \Artisan::call('queue:retry', ['id' => [$id]]);
        return response()->json(['message' => 'Job requeued.']);
    }

    public function forget(string $id): JsonResponse
    {
        if ($id === 'all') {
            DB::table('failed_jobs')->delete();
            return response()->json(['message' => 'All failed jobs removed.']);
        }

        $deleted = DB::table('failed_jobs')->where('id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Failed job not found.'], 404);
        }

        return response()->json(['message' => 'Failed job removed.']);
    }
}
