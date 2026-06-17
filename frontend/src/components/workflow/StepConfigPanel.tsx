"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Save, ChevronDown, ShieldAlert, Copy, RotateCcw, Power, PowerOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Node } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { webhooksApi } from "@/lib/api";
import { toast } from "sonner";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "keyvalue";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

function getFieldsForStepType(stepType: string): ConfigField[] {
  switch (stepType) {
    case "trigger":
    case "webhook":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Nom du déclencheur" },
        { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://..." },
      ];
    case "http_request":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "HTTP Request" },
        {
          key: "method",
          label: "Method",
          type: "select",
          options: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "DELETE", value: "DELETE" },
          ],
        },
        { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/endpoint" },
        { key: "headers", label: "Headers", type: "keyvalue", placeholder: "Content-Type: application/json" },
        { key: "body", label: "Body", type: "textarea", placeholder: '{"key": "value"}' },
      ];
    case "condition":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Condition" },
        { key: "field", label: "Field", type: "text", placeholder: "data.status" },
        {
          key: "operator",
          label: "Operator",
          type: "select",
          options: [
            { label: "==", value: "==" },
            { label: "!=", value: "!=" },
            { label: ">", value: ">" },
            { label: "<", value: "<" },
            { label: "contains", value: "contains" },
          ],
        },
        { key: "value", label: "Value", type: "text", placeholder: "active" },
      ];
    case "delay":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Delay" },
        { key: "delay_seconds", label: "Delay (seconds)", type: "number", placeholder: "60" },
      ];
    case "email":
    case "email_send":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Send Email" },
        { key: "to", label: "To", type: "text", placeholder: "user@example.com" },
        { key: "subject", label: "Subject", type: "text", placeholder: "Hello!" },
        { key: "body", label: "Body", type: "textarea", placeholder: "Email content..." },
      ];
    case "transform":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Transform" },
        { key: "code", label: "Code", type: "textarea", placeholder: "// Transformation code" },
      ];
    case "code":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Code" },
        { key: "code", label: "Code", type: "textarea", placeholder: "// Write your JavaScript code here" },
        { key: "timeout", label: "Timeout (seconds)", type: "number", placeholder: "5" },
      ];
    case "error_handler":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Error Handler" },
        {
          key: "error_type",
          label: "Error Type",
          type: "select",
          options: [
            { label: "Any Error", value: "any" },
            { label: "HTTP Error", value: "http_error" },
            { label: "Timeout", value: "timeout" },
            { label: "Custom", value: "custom" },
          ],
        },
        { key: "fallback_action", label: "Fallback Action", type: "select", options: [
          { label: "Retry", value: "retry" },
          { label: "Abort", value: "abort" },
          { label: "Continue", value: "continue" },
        ]},
      ];
    case "approval":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Approval step" },
        { key: "message", label: "Message", type: "textarea", placeholder: "Message to reviewer..." },
        {
          key: "approval_options",
          label: "Approval Options",
          type: "select",
          options: [
            { label: "Single approver", value: "single" },
            { label: "Any approver", value: "any" },
            { label: "All approvers", value: "all" },
          ],
        },
      ];
    case "ai":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "AI step" },
        { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Write your prompt here..." },
        {
          key: "provider",
          label: "Provider",
          type: "select",
          options: [
            { label: "OpenAI", value: "openai" },
            { label: "Anthropic", value: "anthropic" },
            { label: "Ollama (Local)", value: "ollama" },
          ],
        },
        { key: "model", label: "Model", type: "text", placeholder: "gpt-4o-mini" },
        { key: "api_key", label: "API Key", type: "text", placeholder: "sk-..." },
      ];
    default:
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Step label" },
      ];
  }
}

interface StepConfigPanelProps {
  node: Node;
  onClose: () => void;
  onDelete: (id: string) => void;
  onApply: (id: string, config: Record<string, unknown>) => void;
  onLabelChange: (id: string, label: string) => void;
}

export default function StepConfigPanel({
  node,
  onClose,
  onDelete,
  onApply,
  onLabelChange,
}: StepConfigPanelProps) {
  const stepType = (node.data?.stepType as string) || "action";
  const fields = getFieldsForStepType(stepType);
  const existingConfig = (node.data?.config as Record<string, unknown>) || {};
  const workflowId = Number(useParams().id);

  const [config, setConfig] = useState<Record<string, unknown>>({ ...existingConfig });
  const [label, setLabel] = useState((node.data?.label as string) || "");
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);

  // Webhook data
  const nodeId = Number(node.id);

  const { data: webhooksData } = useQuery({
    queryKey: ["webhooks", workflowId, nodeId],
    queryFn: () => webhooksApi.list(workflowId),
    enabled: stepType === "webhook" && !!workflowId,
  });

  const webhook = Array.isArray(webhooksData?.data)
    ? webhooksData.data.find((wh) => wh.step_id === nodeId)
    : undefined;

  const toggleMutation = useMutation({
    mutationFn: () => webhooksApi.toggle(webhook!.id),
    onSuccess: () => {
      toast.success("Webhook " + (webhook?.is_active ? "désactivé" : "activé"));
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => webhooksApi.regenerate(webhook!.id),
    onSuccess: () => {
      toast.success("Token regénéré");
      setRegenerateConfirm(false);
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const webhookUrl = webhook ? `${baseUrl.replace(/\/api$/, "")}/api/webhook/${webhook.token}` : "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    setConfig({ ...existingConfig });
    setLabel((node.data?.label as string) || "");
  }, [node.id]);

  const handleApply = () => {
    onLabelChange(node.id, label);
    onApply(node.id, config);
    onClose();
  };

  const handleDelete = () => {
    onDelete(node.id);
    onClose();
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const typeDisplayName = stepType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">
            Configurer {label || typeDisplayName}
          </h3>
          <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
            {stepType === "error_handler" && <ShieldAlert className="h-3 w-3 text-orange-400" />}
            {typeDisplayName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-zinc-500 hover:text-zinc-300"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {field.label}
            </label>
            {field.type === "select" ? (
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-100 appearance-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                  value={(config[field.key] as string) || ""}
                  onChange={(e) => updateConfig(field.key, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            ) : field.type === "textarea" ? (
              <textarea
                className={`w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y ${
                  field.key === "code" ? "font-mono min-h-[300px]" : "min-h-[80px]"
                }`}
                rows={field.key === "code" ? 15 : undefined}
                placeholder={field.placeholder}
                value={(config[field.key] as string) || ""}
                onChange={(e) => updateConfig(field.key, e.target.value)}
              />
            ) : field.type === "number" ? (
              <Input
                type="number"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder={field.placeholder}
                value={(config[field.key] as string) || ""}
                onChange={(e) => updateConfig(field.key, e.target.value)}
              />
            ) : field.type === "keyvalue" ? (
              <Input
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder={field.placeholder}
                value={(config[field.key] as string) || ""}
                onChange={(e) => updateConfig(field.key, e.target.value)}
              />
            ) : (
              <Input
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                placeholder={field.placeholder}
                value={field.key === "label" ? label : ((config[field.key] as string) || "")}
                onChange={(e) => {
                  if (field.key === "label") {
                    setLabel(e.target.value);
                  } else {
                    updateConfig(field.key, e.target.value);
                  }
                }}
              />
            )}
          </div>
        ))}
        {stepType === "code" && (
          <div className="rounded-md border border-cyan-900/50 bg-cyan-950/20 p-3">
            <p className="text-xs text-cyan-400 leading-relaxed">
              The code runs in a sandboxed Node.js VM. Use <code className="text-cyan-300 font-mono text-[11px] bg-cyan-950/50 px-1 rounded">return</code> to output data. Input is available in <code className="text-cyan-300 font-mono text-[11px] bg-cyan-950/50 px-1 rounded">input</code> object.
            </p>
          </div>
        )}

        {/* Webhook Info */}
        {stepType === "webhook" && (
              <div className="border-t border-zinc-800 pt-4 mt-2 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Webhook
                </h4>

                {webhook ? (
                  <>
                    {/* URL */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        URL
                      </label>
                      <div className="flex gap-1">
                        <code className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono truncate">
                          {webhookUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-200"
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            toast.success("URL copiée");
                          }}
                          title="Copier l'URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Statut</span>
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          webhook.is_active ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            webhook.is_active ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {webhook.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    {/* Toggle button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full text-xs ${
                        webhook.is_active
                          ? "border-red-800/50 text-red-400 hover:bg-red-950/30"
                          : "border-green-800/50 text-green-400 hover:bg-green-950/30"
                      }`}
                      onClick={() => toggleMutation.mutate()}
                      disabled={toggleMutation.isPending}
                    >
                      {webhook.is_active ? (
                        <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {webhook.is_active ? "Désactiver" : "Activer"}
                    </Button>

                    {/* Regenerate token */}
                    {!regenerateConfirm ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        onClick={() => setRegenerateConfirm(true)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Regénérer le token
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => regenerateMutation.mutate()}
                          disabled={regenerateMutation.isPending}
                        >
                          {regenerateMutation.isPending ? (
                            <span className="animate-spin">⟳</span>
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-zinc-400"
                          onClick={() => setRegenerateConfirm(false)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500 text-center">
                      {webhooksData ? (
                        <>
                          Aucun webhook configuré pour ce step.
                          <br />
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs text-violet-400 px-0 h-auto"
                            onClick={async () => {
                              try {
                                await webhooksApi.create(workflowId, nodeId);
                                toast.success("Webhook créé");
                              } catch (err: any) {
                                toast.error("Erreur: " + err.message);
                              }
                            }}
                          >
                            Créer un webhook
                          </Button>
                        </>
                      ) : (
                        "Chargement..."
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

      {/* Actions */}
      <div className="border-t border-zinc-800 p-4 space-y-2">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          onClick={handleApply}
        >
          <Save className="h-4 w-4 mr-2" />
          Appliquer
        </Button>
        <Button
          variant="ghost"
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
