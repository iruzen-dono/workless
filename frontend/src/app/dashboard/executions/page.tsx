"use client";

import { PlayCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-900/30 text-emerald-400",
  running: "bg-blue-900/30 text-blue-400",
  failed: "bg-red-900/30 text-red-400",
  pending: "bg-zinc-800 text-zinc-400",
  cancelled: "bg-zinc-800 text-zinc-500",
};

export default function ExecutionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Exécutions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Historique des exécutions de workflows
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Rechercher..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      <Card className="border-zinc-800 bg-zinc-900 p-12 text-center">
        <PlayCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">
          Aucune exécution
        </h3>
        <p className="text-sm text-zinc-600">
          Lancez un workflow pour voir apparaître les exécutions ici.
        </p>
      </Card>
    </div>
  );
}
