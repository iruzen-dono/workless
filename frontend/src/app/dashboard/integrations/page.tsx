"use client";

import { useState } from "react";
import { Cable, Mail, Globe, MessageCircle, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api";
import { X } from "lucide-react";

const integrationDefs = [
  {
    type: "discord",
    label: "Discord",
    description: "Envoyer et recevoir des messages Discord",
    icon: MessageCircle,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    type: "telegram",
    label: "Telegram",
    description: "Bot Telegram pour notifications",
    icon: MessageCircle,
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "text", placeholder: "Votre token Telegram" },
      { key: "chat_id", label: "Chat ID", type: "text", placeholder: "@username ou -123456" },
    ],
  },
  {
    type: "slack",
    label: "Slack",
    description: "Notifications Slack via Webhook",
    icon: MessageCircle,
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/services/..." },
    ],
  },
  {
    type: "email_smtp",
    label: "Email (SMTP)",
    description: "Serveur SMTP pour envoi d'emails",
    icon: Mail,
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    fields: [
      { key: "host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", type: "text", placeholder: "587" },
      { key: "username", label: "Username", type: "text", placeholder: "user@gmail.com" },
      { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  {
    type: "http",
    label: "HTTP / Webhook",
    description: "Webhook entrant personnalisé",
    icon: Globe,
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Mon webhook" },
    ],
  },
];

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [connectModal, setConnectModal] = useState<{ type: string; label: string; fields: any[] } | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationsApi.list(),
  });

  const integrations = data?.data || [];

  const connectMutation = useMutation({
    mutationFn: () => {
      if (!connectModal) throw new Error("No integration selected");
      return integrationsApi.connect(connectModal.type, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Intégration connectée");
      setConnectModal(null);
      setConfig({});
    },
    onError: (err: Error) => {
      toast.error("Erreur: " + err.message);
    },
  });

  const openConnectModal = (def: typeof integrationDefs[0]) => {
    setConnectModal({ type: def.type, label: def.label, fields: def.fields });
    setConfig({});
  };

  const connectedTypes = integrations.map((i) => i.type);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Intégrations</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Connectez vos services préférés
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Chargement...</div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationDefs.map((def) => {
            const isConnected = connectedTypes.includes(def.type);
            const Icon = def.icon;
            return (
              <Card
                key={def.type}
                className={`border-zinc-800 bg-zinc-900 p-5 hover:bg-zinc-800/50 transition-colors ${
                  isConnected ? "ring-1 ring-emerald-500/30" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${def.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {isConnected && (
                    <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800 text-xs">
                      Connecté
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-zinc-200 mb-1">{def.label}</h3>
                <p className="text-sm text-zinc-500 mb-4">{def.description}</p>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  className={
                    isConnected
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      : "bg-violet-600 hover:bg-violet-500"
                  }
                  onClick={() => openConnectModal(def)}
                >
                  {isConnected ? (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Reconfigurer
                    </>
                  ) : (
                    "Connecter"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">
                Connecter {connectModal.label}
              </h2>
              <button
                onClick={() => setConnectModal(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {connectModal.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    {field.label}
                  </label>
                  <Input
                    type={field.type || "text"}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    placeholder={field.placeholder}
                    value={config[field.key] || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="text-zinc-400"
                  onClick={() => setConnectModal(null)}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-500"
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? "Connexion..." : "Connecter"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
