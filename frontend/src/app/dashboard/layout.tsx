"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Workflow,
  PlayCircle,
  Settings,
  Cable,
  BarChart3,
  Home,
  ChevronDown,
  Clock,
  Activity,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow },
  { href: "/dashboard/executions", label: "Exécutions", icon: PlayCircle },
  { href: "/dashboard/approvals", label: "Approvals", icon: UserCheck },
  { href: "/dashboard/schedules", label: "Schedules", icon: Clock },
  { href: "/dashboard/integrations", label: "Intégrations", icon: Cable },
  { href: "/dashboard/queue", label: "Queue", icon: Activity },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Workflow className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">Workless</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-violet-600/10 text-violet-400"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
              I
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Iruzen</p>
                <p className="text-xs text-zinc-500">Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="border-t border-zinc-800 p-3 text-zinc-500 hover:text-zinc-300"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform mx-auto",
              collapsed ? "rotate-90" : "rotate-0"
            )}
          />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
