// Workless — TypeScript types

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export type StepType = 'trigger' | 'webhook' | 'schedule' | 'action' | 'condition' | 'delay' | 'loop' | 'transform' | 'http_request' | 'email' | 'error_handler' | 'code' | 'approval' | 'ai';

export interface Step {
  id: number;
  workflow_id: number;
  step_type: StepType;
  config: Record<string, any>;
  position_x: number | null;
  position_y: number | null;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepConnection {
  id: number;
  workflow_id: number;
  source_step_id: number;
  target_step_id: number;
  source_port: string | null;
  target_port: string | null;
  condition_expression: Record<string, any> | null;
  created_at: string;
}

export interface Execution {
  id: number;
  workflow_id: number;
  workflow_version_id: number | null;
  triggered_by: 'manual' | 'webhook' | 'schedule';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface ExecutionLog {
  id: number;
  execution_id: number;
  step_id: number | null;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data: Record<string, any> | null;
  created_at: string;
}

export interface ExecutionStepResult {
  id: number;
  execution_id: number;
  step_id: number;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  attempt_number: number;
  error_message: string | null;
}

export interface Integration {
  id: number;
  workspace_id: number;
  type: string;
  created_at: string;
}

export interface WorkflowDefinition {
  version: number;
  steps: StepDefinition[];
  connections: ConnectionDefinition[];
}

export interface StepDefinition {
  id: string;
  type: StepType;
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface ConnectionDefinition {
  from: string;
  to: string;
  condition?: Record<string, any>;
}

export interface Webhook {
  id: number;
  workflow_id: number;
  step_id: number;
  token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
