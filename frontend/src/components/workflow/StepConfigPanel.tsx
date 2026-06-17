"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Node } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";

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
    case "code":
      return [
        { key: "label", label: "Label", type: "text", placeholder: "Transform" },
        { key: "code", label: "Code", type: "textarea", placeholder: "// Transformation code" },
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

  const [config, setConfig] = useState<Record<string, unknown>>({ ...existingConfig });
  const [label, setLabel] = useState((node.data?.label as string) || "");

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
          <p className="text-xs text-zinc-500 truncate">{typeDisplayName}</p>
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
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[80px] resize-y"
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
