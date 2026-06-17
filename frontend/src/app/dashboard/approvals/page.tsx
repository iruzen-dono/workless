"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalsApi, type Approval } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Pending approvals
  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
  } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => approvalsApi.pending(),
    refetchInterval: 10_000,
  });

  // History (all approvals)
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ["approvals", "history"],
    queryFn: () => approvalsApi.list(),
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: number;
      decision: "approved" | "rejected";
      note?: string;
    }) => approvalsApi.respond(id, decision, note),
    onSuccess: () => {
      toast.success("Decision enregistrée");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setNotes({});
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const pendingApprovals = (pendingData?.data as Approval[]) || [];
  const allApprovals = (historyData?.data as Approval[]) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-900/30 border border-pink-800/50">
          <UserCheck className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Approvals</h1>
          <p className="text-sm text-zinc-500">Human-in-the-Loop</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-200">
            Pending Approvals
          </h2>
          {pendingApprovals.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-700/50">
              {pendingApprovals.length}
            </span>
          )}
        </div>

        {pendingLoading && (
          <div className="flex items-center gap-2 text-zinc-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading approvals...</span>
          </div>
        )}

        {pendingError && (
          <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-400">
            Unable to load pending approvals.
          </div>
        )}

        {!pendingLoading && !pendingError && pendingApprovals.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              No pending approvals. All caught up!
            </p>
          </div>
        )}

        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 mb-3 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">
                      {approval.step_label || "Approval"}
                    </span>
                    <span className="text-xs text-zinc-500">in</span>
                    <span className="text-sm text-violet-400 font-medium">
                      {approval.workflow_name || `Workflow #${approval.workflow_id}`}
                    </span>
                  </div>
                  {approval.message && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                      {approval.message}
                    </p>
                  )}
                  {approval.input_snapshot && Object.keys(approval.input_snapshot).length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === approval.id ? null : approval.id)
                      }
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-2"
                    >
                      {expandedId === approval.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      Input Snapshot
                    </button>
                  )}
                  {expandedId === approval.id && approval.input_snapshot && (
                    <pre className="mt-2 p-3 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-mono overflow-auto max-h-40">
                      {JSON.stringify(approval.input_snapshot, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      placeholder="Note (optional)..."
                      className="w-40 h-16 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                      value={notes[approval.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [approval.id]: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7"
                        onClick={() =>
                          respondMutation.mutate({
                            id: approval.id,
                            decision: "approved",
                            note: notes[approval.id],
                          })
                        }
                        disabled={respondMutation.isPending}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs h-7"
                        onClick={() =>
                          respondMutation.mutate({
                            id: approval.id,
                            decision: "rejected",
                            note: notes[approval.id],
                          })
                        }
                        disabled={respondMutation.isPending}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">History</h2>

        {historyLoading && (
          <div className="flex items-center gap-2 text-zinc-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading history...</span>
          </div>
        )}

        {!historyLoading && allApprovals.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <p className="text-sm text-zinc-500">No approval history yet.</p>
          </div>
        )}

        {allApprovals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Workflow</th>
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Step</th>
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Note</th>
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allApprovals.map((approval) => (
                  <tr
                    key={approval.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30"
                  >
                    <td className="py-3 px-3 text-zinc-300">
                      {approval.workflow_name || `#${approval.workflow_id}`}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {approval.step_label || "Approval"}
                    </td>
                    <td className="py-3 px-3">
                      {approval.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-800/40">
                          <ThumbsUp className="h-3 w-3" />
                          Approved
                        </span>
                      ) : approval.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/20 px-2 py-0.5 rounded-full border border-red-800/40">
                          <ThumbsDown className="h-3 w-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-800/40">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 max-w-[200px] truncate">
                      {approval.note || "—"}
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {approval.responded_at
                        ? new Date(approval.responded_at).toLocaleDateString()
                        : new Date(approval.requested_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
