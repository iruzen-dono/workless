"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  MoreHorizontal,
  Play,
  Square,
  Search,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { workflowsApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Schedule {
  id: number;
  name: string;
  description: string | null;
  cron_expression: string;
  workflow_id: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchSchedules(): Promise<{ data: Schedule[] }> {
  const res = await fetch(`${API_BASE}/schedules`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

async function createSchedule(
  data: Partial<Schedule>
): Promise<{ data: Schedule }> {
  const res = await fetch(`${API_BASE}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

async function updateSchedule(
  id: number,
  data: Partial<Schedule>
): Promise<{ data: Schedule }> {
  const res = await fetch(`${API_BASE}/schedules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

async function deleteSchedule(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/schedules/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCron, setFormCron] = useState("");
  const [formWorkflowId, setFormWorkflowId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [cronError, setCronError] = useState("");

  // Fetch schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });

  const schedules = schedulesData?.data || [];

  // Fetch workflows for the select
  const { data: workflowsData } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => workflowsApi.list(),
  });

  const workflows = workflowsData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      createSchedule({
        name: formName,
        description: formDescription || null,
        cron_expression: formCron,
        workflow_id: Number(formWorkflowId),
        is_active: formActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule créé");
      resetForm();
      setShowNewModal(false);
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      updateSchedule(editSchedule!.id, {
        name: formName,
        description: formDescription || null,
        cron_expression: formCron,
        workflow_id: Number(formWorkflowId),
        is_active: formActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule mis à jour");
      resetForm();
      setEditSchedule(null);
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule supprimé");
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  // Toggle active/inactive
  const toggleMutation = useMutation({
    mutationFn: (schedule: Schedule) =>
      updateSchedule(schedule.id, { is_active: !schedule.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Statut modifié");
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCron("");
    setFormWorkflowId("");
    setFormActive(true);
    setCronError("");
  };

  const openEdit = (schedule: Schedule) => {
    setEditSchedule(schedule);
    setFormName(schedule.name);
    setFormDescription(schedule.description || "");
    setFormCron(schedule.cron_expression);
    setFormWorkflowId(String(schedule.workflow_id));
    setFormActive(schedule.is_active);
    setCronError("");
    setShowNewModal(true);
  };

  const openNew = () => {
    setEditSchedule(null);
    resetForm();
    setShowNewModal(true);
  };

  const validateCron = (expr: string): boolean => {
    // Basic cron validation: 5 or 6 space-separated fields
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!formCron.trim()) {
      toast.error("L'expression cron est requise");
      return;
    }
    if (!validateCron(formCron)) {
      toast.error("Expression cron invalide (ex: */5 * * * *)");
      return;
    }
    if (!formWorkflowId) {
      toast.error("Veuillez sélectionner un workflow");
      return;
    }

    if (editSchedule) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const getWorkflowName = (id: number) => {
    return workflows.find((w) => w.id === id)?.name || `Workflow #${id}`;
  };

  const filtered = schedules.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      getWorkflowName(s.workflow_id)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Schedules
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gérez vos tâches planifiées (cron)
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-500"
          onClick={openNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau schedule
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Rechercher un schedule..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900 p-12 text-center">
              <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                Aucun schedule
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                Créez votre premier schedule pour planifier des tâches
              </p>
              <Button
                className="bg-violet-600 hover:bg-violet-500"
                onClick={openNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un schedule
              </Button>
            </Card>
          ) : (
            filtered.map((schedule) => (
              <Card
                key={schedule.id}
                className="border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-600/20">
                      <Clock className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-200">
                          {schedule.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            schedule.is_active
                              ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {schedule.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                          {schedule.cron_expression}
                        </code>
                        <span className="text-xs text-zinc-600">
                          → {getWorkflowName(schedule.workflow_id)}
                        </span>
                      </div>
                      {schedule.description && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {schedule.description}
                        </p>
                      )}
                      {schedule.last_run_at && (
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Dernier run:{" "}
                          {new Date(schedule.last_run_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${
                        schedule.is_active
                          ? "text-emerald-500 hover:text-emerald-400"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                      onClick={() => toggleMutation.mutate(schedule)}
                      title={
                        schedule.is_active
                          ? "Désactiver"
                          : "Activer"
                      }
                    >
                      {schedule.is_active ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        <DropdownMenuItem
                          onClick={() => openEdit(schedule)}
                        >
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={(e) => {
                            e.preventDefault();
                            if (
                              confirm(
                                "Supprimer ce schedule ?"
                              )
                            ) {
                              deleteMutation.mutate(
                                schedule.id
                              );
                            }
                          }}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* New/Edit Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              {editSchedule
                ? "Modifier le schedule"
                : "Nouveau schedule"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nom *
                </label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  placeholder="Mon schedule"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[60px] resize-y"
                  placeholder="Description optionnelle..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Expression Cron *
                </label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono"
                  placeholder="*/5 * * * *"
                  value={formCron}
                  onChange={(e) => {
                    setFormCron(e.target.value);
                    if (e.target.value && !validateCron(e.target.value)) {
                      setCronError(
                        "Format invalide — 5 champs requis (min heure jour mois jour_semaine)"
                      );
                    } else {
                      setCronError("");
                    }
                  }}
                />
                {cronError && (
                  <p className="text-xs text-red-400 mt-1">{cronError}</p>
                )}
                <p className="text-xs text-zinc-600 mt-1">
                  Format: minute heure jour mois jour_semaine (ex: */5 * * * *
                  = toutes les 5 min)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Workflow associé *
                </label>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  value={formWorkflowId}
                  onChange={(e) => setFormWorkflowId(e.target.value)}
                >
                  <option value="">Sélectionner un workflow...</option>
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <label
                  htmlFor="is_active"
                  className="text-sm text-zinc-300"
                >
                  Actif
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="text-zinc-400"
                  onClick={() => {
                    setShowNewModal(false);
                    setEditSchedule(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-500"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending
                    ? "Enregistrement..."
                    : editSchedule
                    ? "Mettre à jour"
                    : "Créer"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
