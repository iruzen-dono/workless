"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Workflow,
  PlayCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Mock chart data since we don't have a real analytics endpoint
const mockExecutionData = [
  { day: "Lun", success: 12, failed: 2 },
  { day: "Mar", success: 18, failed: 1 },
  { day: "Mer", success: 15, failed: 3 },
  { day: "Jeu", success: 22, failed: 0 },
  { day: "Ven", success: 20, failed: 2 },
  { day: "Sam", success: 8, failed: 1 },
  { day: "Dim", success: 5, failed: 0 },
];

const mockWorkflowStats = [
  { name: "Notifier Slack", executions: 45, success: 98 },
  { name: "Email Bienvenue", executions: 120, success: 100 },
  { name: "Backup DB", executions: 30, success: 97 },
  { name: "Webhook Zapier", executions: 67, success: 99 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  // Use real API if available, otherwise show mock data
  const { data: executionsData } = useQuery({
    queryKey: ["executions-summary"],
    queryFn: () => fetch("/api/executions").then((r) => r.json()),
    retry: false,
  });

  const statsCards = [
    {
      label: "Workflows actifs",
      value: "—",
      icon: Workflow,
      color: "from-violet-600 to-indigo-600",
      sub: "Total des workflows",
    },
    {
      label: "Exécutions aujourd'hui",
      value: "0",
      icon: PlayCircle,
      color: "from-emerald-600 to-teal-600",
      sub: "Dernières 24h",
    },
    {
      label: "Taux de succès",
      value: "98%",
      icon: CheckCircle2,
      color: "from-green-600 to-emerald-600",
      sub: "Moyenne 7 jours",
    },
    {
      label: "Échecs",
      value: "9",
      icon: XCircle,
      color: "from-red-600 to-rose-600",
      sub: "Total ce mois",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Statistiques et performances
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
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
              <p className="text-xs text-zinc-600 mt-0.5">{stat.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exécutions par jour */}
        <Card className="border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Exécutions par jour
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockExecutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="day"
                  stroke="#52525b"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <YAxis stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="success" name="Succès" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Échecs" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Taux de succès */}
        <Card className="border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Taux de succès par workflow
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockWorkflowStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  stroke="#52525b"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#52525b"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  domain={[90, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="success"
                  name="Taux de succès %"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Workflow performance table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-100">
            Performance par workflow
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Workflow</th>
                <th className="text-left px-5 py-3 font-medium">Exécutions</th>
                <th className="text-left px-5 py-3 font-medium">Succès</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {mockWorkflowStats.map((wf) => (
                <tr
                  key={wf.name}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-5 py-3 text-zinc-200">{wf.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{wf.executions}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${wf.success}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">{wf.success}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        wf.success >= 99
                          ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                          : "bg-amber-900/30 text-amber-400 border-amber-800"
                      }`}
                    >
                      {wf.success >= 99 ? "Excellent" : "Bon"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
