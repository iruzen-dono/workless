export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  steps: Array<{
    step_type: string;
    label: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  connections: Array<{
    source_id: number;
    target_id: number;
    label?: string;
  }>;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "webhook-log-notify",
    name: "Webhook → Log & Notify",
    description:
      "Recevez un webhook, enregistrez les données et envoyez une alerte email si le statut est en erreur.",
    category: "Monitoring & Alerting",
    icon: "Zap",
    steps: [
      {
        step_type: "trigger",
        label: "Webhook Trigger",
        config: { webhook_url: "" },
        position: { x: 250, y: 0 },
      },
      {
        step_type: "action",
        label: "Log Data",
        config: { log_level: "info", message: "Webhook received: {{payload}}" },
        position: { x: 250, y: 150 },
      },
      {
        step_type: "condition",
        label: "Status = error ?",
        config: { field: "payload.data.status", operator: "==", value: "error" },
        position: { x: 250, y: 300 },
      },
      {
        step_type: "email",
        label: "Email Alert",
        config: {
          to: "admin@example.com",
          subject: "Webhook Error Alert",
          body: "An error was detected: {{payload.data.message}}",
        },
        position: { x: 100, y: 450 },
      },
    ],
    connections: [
      { source_id: 0, target_id: 1 },
      { source_id: 1, target_id: 2 },
      { source_id: 2, target_id: 3, label: "true" },
    ],
  },
  {
    id: "schedule-data-export",
    name: "Schedule Data Export",
    description:
      "Planifiez une extraction de données, transformez-les et envoyez-les par email.",
    category: "Data Export",
    icon: "Clock",
    steps: [
      {
        step_type: "schedule",
        label: "Daily Trigger",
        config: { cron_expression: "0 8 * * *", timezone: "UTC" },
        position: { x: 250, y: 0 },
      },
      {
        step_type: "database_query",
        label: "Query Data",
        config: {
          query: "SELECT * FROM reports WHERE date = CURRENT_DATE",
          connection_id: "",
        },
        position: { x: 250, y: 150 },
      },
      {
        step_type: "transform",
        label: "Format CSV",
        config: {
          mapping: [
            { source: "id", target: "ID" },
            { source: "name", target: "Name" },
            { source: "value", target: "Value" },
          ],
          output_format: "csv",
        },
        position: { x: 250, y: 300 },
      },
      {
        step_type: "email",
        label: "Send Report",
        config: {
          to: "user@example.com",
          subject: "Daily Report - {{date}}",
          body: "Please find attached the daily report.",
          attachments: [],
        },
        position: { x: 250, y: 450 },
      },
    ],
    connections: [
      { source_id: 0, target_id: 1 },
      { source_id: 1, target_id: 2 },
      { source_id: 2, target_id: 3 },
    ],
  },
  {
    id: "http-monitor",
    name: "HTTP Monitor",
    description:
      "Surveillez un endpoint HTTP toutes les 5 minutes et alertez par email en cas d'erreur.",
    category: "Monitoring & Alerting",
    icon: "Globe",
    steps: [
      {
        step_type: "schedule",
        label: "Every 5 min",
        config: { cron_expression: "*/5 * * * *", timezone: "UTC" },
        position: { x: 250, y: 0 },
      },
      {
        step_type: "http_request",
        label: "GET Healthcheck",
        config: {
          method: "GET",
          url: "https://example.com/health",
          headers: [],
          body: "",
        },
        position: { x: 250, y: 150 },
      },
      {
        step_type: "condition",
        label: "Status != 200 ?",
        config: { field: "response.status_code", operator: "!=", value: "200" },
        position: { x: 250, y: 300 },
      },
      {
        step_type: "email",
        label: "Alert Admin",
        config: {
          to: "admin@example.com",
          subject: "Healthcheck Failed",
          body: "Endpoint returned status {{response.status_code}} at {{now}}",
        },
        position: { x: 100, y: 450 },
      },
    ],
    connections: [
      { source_id: 0, target_id: 1 },
      { source_id: 1, target_id: 2 },
      { source_id: 2, target_id: 3, label: "true" },
    ],
  },
  {
    id: "webhook-transform-store",
    name: "Webhook → Transform → Store",
    description:
      "Recevez un webhook, extrayez des champs spécifiques et enregistrez la réception.",
    category: "Data Integration",
    icon: "Workflow",
    steps: [
      {
        step_type: "trigger",
        label: "Webhook Trigger",
        config: { webhook_url: "" },
        position: { x: 250, y: 0 },
      },
      {
        step_type: "transform",
        label: "Extract Fields",
        config: {
          mapping: [
            { source: "payload.email", target: "email" },
            { source: "payload.name", target: "name" },
            { source: "payload.event", target: "event" },
          ],
          output_format: "json",
        },
        position: { x: 250, y: 150 },
      },
      {
        step_type: "action",
        label: "Log Receipt",
        config: {
          log_level: "info",
          message: "Processed {{event}} from {{email}}",
        },
        position: { x: 250, y: 300 },
      },
    ],
    connections: [
      { source_id: 0, target_id: 1 },
      { source_id: 1, target_id: 2 },
    ],
  },
];
