"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Circle,
  Activity,
  AlertCircle,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { queueApi } from "@/lib/api";
import type { QueueStats, FailedJob } from "@/lib/api";

const priorityColors: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  high: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    bar: "bg-red-500",
    border: "border-red-500/20",
  },
  default: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    bar: "bg-amber-500",
    border: "border-amber-500/20",
  },
  low: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    border: "border-emerald-500/20",
  },
};

const priorityLabels: Record<string, string> = {
  high: "High Priority",
  default: "Default Priority",
  low: "Low Priority",
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 w-8 text-right font-mono">{value}</span>
    </div>
  );
}

function PriorityQueueCard({
  name,
  data,
  colorKey,
}: {
  name: string;
  data: { pending: number; delayed: number; reserved: number; total: number };
  colorKey: string;
}) {
  const colors = priorityColors[colorKey] || priorityColors.default;
  const maxVal = Math.max(data.pending, data.delayed, data.reserved, 1);

  return (
    <Card className={`border-zinc-800 bg-zinc-900 ${colors.border}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
            <h3 className={`font-semibold text-sm ${colors.text}`}>{name}</h3>
          </div>
          <Badge
            variant="outline"
            className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}
          >
            {data.total} total
          </Badge>
        </div>
        <div className="space-y-2">
          <ProgressBar value={data.pending} max={maxVal} color={colors.bar} />
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Pending</span>
          </div>
          <ProgressBar value={data.reserved} max={maxVal} color={colors.bar} />
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Reserved</span>
          </div>
          <ProgressBar value={data.delayed} max={maxVal} color={colors.bar} />
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Delayed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FailedJobsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: failedData, isLoading } = useQuery({
    queryKey: ["failed-jobs", page],
    queryFn: () => queueApi.failed(page, 10),
  });

  const jobs = failedData?.data || [];
  const meta = failedData?.meta;

  const retryMutation = useMutation({
    mutationFn: (id: number) => queueApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("Job requeued");
    },
    onError: (err: Error) => {
      toast.error("Failed to retry: " + err.message);
    },
  });

  const forgetMutation = useMutation({
    mutationFn: (id: number) => queueApi.forget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("Job removed");
    },
    onError: (err: Error) => {
      toast.error("Failed to remove: " + err.message);
    },
  });

  const retryAllMutation = useMutation({
    mutationFn: () => queueApi.retryAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("All jobs requeued");
    },
    onError: (err: Error) => {
      toast.error("Failed to retry all: " + err.message);
    },
  });

  const forgetAllMutation = useMutation({
    mutationFn: () => queueApi.forgetAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["failed-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("All failed jobs removed");
    },
    onError: (err: Error) => {
      toast.error("Failed to remove all: " + err.message);
    },
  });

  const truncatePayload = (payload: Record<string, any>) => {
    const str = JSON.stringify(payload);
    if (str.length > 60) return str.slice(0, 60) + "...";
    return str;
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Failed Jobs</h2>
          {meta && (
            <span className="text-xs text-zinc-500">({meta.total} total)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100 text-xs"
            onClick={() => retryAllMutation.mutate()}
            disabled={retryAllMutation.isPending || jobs.length === 0}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Retry All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 text-xs"
            onClick={() => {
              if (confirm("Remove all failed jobs?")) {
                forgetAllMutation.mutate();
              }
            }}
            disabled={forgetAllMutation.isPending || jobs.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Forget All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-zinc-500">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
          <p className="text-sm">No failed jobs</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Queue</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Payload</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Failed At</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: FailedJob) => (
                  <tr key={job.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">#{job.id}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          job.queue === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : job.queue === "low"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {job.queue}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs max-w-[200px] truncate">
                      <span title={JSON.stringify(job.payload)}>
                        {truncatePayload(job.payload)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(job.failed_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-emerald-400"
                          onClick={() => retryMutation.mutate(job.id)}
                          disabled={retryMutation.isPending}
                          title="Retry"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                          onClick={() => {
                            if (confirm("Remove this failed job?")) {
                              forgetMutation.mutate(job.id);
                            }
                          }}
                          disabled={forgetMutation.isPending}
                          title="Forget"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, current, and neighbors
                    return (
                      p === 1 ||
                      p === meta.last_page ||
                      Math.abs(p - meta.current_page) <= 1
                    );
                  })
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-zinc-600 px-1">...</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 min-w-[28px] px-1 text-xs ${
                          p === page
                            ? "bg-violet-600/10 text-violet-400"
                            : "text-zinc-400 hover:text-zinc-100"
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function QueueMonitorPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: queueApi.stats,
    refetchInterval: 10_000, // auto-refresh every 10s
  });

  const stats = statsData?.data;
  const queues = stats?.queues;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Queue Monitor</h1>
        <p className="text-sm text-zinc-500 mt-1">
          BullMQ-style priority queue management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-5" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Queued Jobs</p>
              <Circle className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-100">
              {statsLoading ? "..." : stats?.total_queued ?? 0}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Total jobs in queues</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 opacity-5" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Active Workers</p>
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-100">
              {statsLoading ? "..." : stats?.active_workers ?? 0}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Currently processing</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-600 opacity-5" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Failed Jobs</p>
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-100">
              {statsLoading ? "..." : stats?.failed_jobs ?? 0}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue Cards */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">
          Priority Queues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {queues && (
            <>
              <PriorityQueueCard
                name={priorityLabels.high}
                data={queues.high}
                colorKey="high"
              />
              <PriorityQueueCard
                name={priorityLabels.default}
                data={queues.default}
                colorKey="default"
              />
              <PriorityQueueCard
                name={priorityLabels.low}
                data={queues.low}
                colorKey="low"
              />
            </>
          )}
          {!queues && statsLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-zinc-800 bg-zinc-900 p-4 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-24 mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 bg-zinc-800 rounded" />
                    <div className="h-2 bg-zinc-800 rounded w-3/4" />
                    <div className="h-2 bg-zinc-800 rounded" />
                    <div className="h-2 bg-zinc-800 rounded w-3/4" />
                    <div className="h-2 bg-zinc-800 rounded" />
                    <div className="h-2 bg-zinc-800 rounded w-3/4" />
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Failed Jobs Table */}
      <FailedJobsTable />
    </div>
  );
}
