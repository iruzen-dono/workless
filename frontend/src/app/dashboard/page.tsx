"use client";

import { Workflow, PlayCircle, Cable, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    label: "Workflows actifs",
    value: "0",
    icon: Workflow,
    color: "from-violet-600 to-indigo-600",
  },
  {
    label: "Exécutions aujourd'hui",
    value: "0",
    icon: PlayCircle,
    color: "from-emerald-600 to-teal-600",
  },
  {
    label: "Intégrations",
    value: "0",
    icon: Cable,
    color: "from-amber-600 to-orange-600",
  },
  {
    label: "Taux de succès",
    value: "—",
    icon: BarChart3,
    color: "from-blue-600 to-cyan-600",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bienvenue sur Workless — votre moteur de workflow.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden border-zinc-800 bg-zinc-900 p-4"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-3xl font-bold mt-3 text-zinc-100">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card className="border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Démarrage rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/workflows"
            className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4 hover:bg-zinc-800 transition-colors"
          >
            <Workflow className="h-5 w-5 text-violet-400" />
            <div>
              <p className="font-medium text-sm text-zinc-200">
                Créer un workflow
              </p>
              <p className="text-xs text-zinc-500">
                Builder visuel drag & drop
              </p>
            </div>
          </a>
          <a
            href="/dashboard/integrations"
            className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4 hover:bg-zinc-800 transition-colors"
          >
            <Cable className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-medium text-sm text-zinc-200">
                Connecter une intégration
              </p>
              <p className="text-xs text-zinc-500">
                Discord, Telegram, Email...
              </p>
            </div>
          </a>
          <a
            href="/dashboard/executions"
            className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4 hover:bg-zinc-800 transition-colors"
          >
            <PlayCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-sm text-zinc-200">
                Voir les exécutions
              </p>
              <p className="text-xs text-zinc-500">
                Logs et historique
              </p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
