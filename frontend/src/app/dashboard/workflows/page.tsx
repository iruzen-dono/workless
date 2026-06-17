"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Workflow, MoreHorizontal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const statusColors: Record<string, string> = {
  draft: "bg-zinc-800 text-zinc-400",
  active: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
  paused: "bg-amber-900/30 text-amber-400 border-amber-800",
  archived: "bg-zinc-800 text-zinc-500",
};

export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => workflowsApi.list(),
  });

  const workflows = data?.data || [];

  const createMutation = useMutation({
    mutationFn: () =>
      workflowsApi.create({
        name: newName || "Nouveau workflow",
        description: newDescription || null,
        status: "draft",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow créé");
      setShowNewModal(false);
      setNewName("");
      setNewDescription("");
      if (res.data?.id) {
        router.push(`/dashboard/workflows/${res.data.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workflowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow supprimé");
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Workflows</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gérez vos automatisations
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-500"
          onClick={() => setShowNewModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Rechercher un workflow..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Chargement...</div>
      ) : (
        /* List */
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900 p-12 text-center">
              <Workflow className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                Aucun workflow
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                Créez votre premier workflow pour commencer
              </p>
              <Button
                className="bg-violet-600 hover:bg-violet-500"
                onClick={() => setShowNewModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un workflow
              </Button>
            </Card>
          ) : (
            filtered.map((wf) => (
              <Link
                key={wf.id}
                href={`/dashboard/workflows/${wf.id}`}
                className="block"
              >
                <Card className="border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-600/20">
                        <Workflow className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">{wf.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColors[wf.status] || statusColors.draft}`}
                          >
                            {wf.status}
                          </Badge>
                          {wf.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs border-zinc-700 text-zinc-500"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600">
                        {new Date(wf.updated_at).toLocaleDateString()}
                      </span>
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
                            onClick={() => router.push(`/dashboard/workflows/${wf.id}`)}
                          >
                            Ouvrir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={(e) => {
                              e.preventDefault();
                              if (confirm("Supprimer ce workflow ?")) {
                                deleteMutation.mutate(wf.id);
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
              </Link>
            ))
          )}
        </div>
      )}

      {/* New workflow modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Nouveau workflow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nom
                </label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  placeholder="Mon workflow"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[60px] resize-y"
                  placeholder="Description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  className="text-zinc-400"
                  onClick={() => setShowNewModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-500"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
