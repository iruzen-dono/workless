"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Workflow, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  draft: "bg-zinc-800 text-zinc-400",
  active: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
  paused: "bg-amber-900/30 text-amber-400 border-amber-800",
  archived: "bg-zinc-800 text-zinc-500",
};

// Mock data for now
const mockWorkflows = [
  { id: 1, name: "Notifier Slack sur nouvelle commande", status: "active", updated_at: "2026-06-17T12:00:00Z", tags: ["e-commerce"] },
  { id: 2, name: "Email de bienvenue automatique", status: "draft", updated_at: "2026-06-16T15:30:00Z", tags: ["marketing"] },
  { id: 3, name: "Backup quotidien PostgreSQL", status: "active", updated_at: "2026-06-15T09:00:00Z", tags: ["devops"] },
];

export default function WorkflowsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockWorkflows.filter((w) =>
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
        <Button className="bg-violet-600 hover:bg-violet-500">
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

      {/* List */}
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
            <Button className="bg-violet-600 hover:bg-violet-500">
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
                          className={`text-xs ${statusColors[wf.status]}`}
                        >
                          {wf.status}
                        </Badge>
                        {wf.tags.map((tag) => (
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
                        <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem>Archiver</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
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
    </div>
  );
}
