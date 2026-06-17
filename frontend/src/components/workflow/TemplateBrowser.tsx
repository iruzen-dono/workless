"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Zap,
  Clock,
  Globe,
  Workflow,
  BarChart3,
  Mail,
  Database,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { workflowsApi } from "@/lib/api";
import { workflowTemplates, type WorkflowTemplate } from "@/lib/templates";

const templateIcons: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  Workflow: <Workflow className="h-6 w-6" />,
  BarChart3: <BarChart3 className="h-6 w-6" />,
  Mail: <Mail className="h-6 w-6" />,
  Database: <Database className="h-6 w-6" />,
  Code: <Code className="h-6 w-6" />,
};

function TemplateCard({
  template,
  onUse,
  isCreating,
}: {
  template: WorkflowTemplate;
  onUse: () => void;
  isCreating: boolean;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800/50 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-600/20 text-violet-400">
          {templateIcons[template.icon] || <Workflow className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-zinc-200 leading-tight">
            {template.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge
          variant="outline"
          className="text-xs border-zinc-700 text-zinc-500"
        >
          {template.steps.length} steps
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-violet-700/50 text-violet-400"
        >
          {template.category}
        </Badge>
      </div>
      <div className="mt-auto">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-500 text-xs"
          size="sm"
          onClick={onUse}
          disabled={isCreating}
        >
          {isCreating ? "Création..." : "Use Template"}
        </Button>
      </div>
    </Card>
  );
}

export default function TemplateBrowser({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const createFromTemplate = useMutation({
    mutationFn: async (template: WorkflowTemplate) => {
      // 1. Create the workflow
      const wfRes = await workflowsApi.create({
        name: template.name,
        description: template.description,
        status: "draft",
      });
      const workflowId = wfRes.data.id;

      // 2. Create each step
      const stepIdMap = new Map<number, number>(); // template index → step id
      for (let i = 0; i < template.steps.length; i++) {
        const stepDef = template.steps[i];
        const stepRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
          }/workflows/${workflowId}/steps`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step_type: stepDef.step_type,
              label: stepDef.label,
              config: stepDef.config,
              position_x: stepDef.position.x,
              position_y: stepDef.position.y,
            }),
          }
        ).then((r) => r.json());
        stepIdMap.set(i, stepRes.data?.id || stepRes.id);
      }

      // 3. Create connections
      for (const conn of template.connections) {
        const sourceId = stepIdMap.get(conn.source_id);
        const targetId = stepIdMap.get(conn.target_id);
        if (sourceId && targetId) {
          await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
            }/workflows/${workflowId}/connections`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source_step_id: sourceId,
                target_step_id: targetId,
                source_port: conn.label || null,
              }),
            }
          );
        }
      }

      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow créé à partir du template");
      setCreatingId(null);
      onOpenChange(false);
      router.push(`/dashboard/workflows/${workflowId}`);
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
      setCreatingId(null);
    },
  });

  // Group templates by category
  const categories = Array.from(
    new Set(workflowTemplates.map((t) => t.category))
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              Créer à partir d&apos;un template
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Choisissez un modèle prêt à l&apos;emploi pour démarrer plus vite
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </Button>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates
                .filter((t) => t.category === category)
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isCreating={creatingId === template.id}
                    onUse={() => {
                      setCreatingId(template.id);
                      createFromTemplate.mutate(template);
                    }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
