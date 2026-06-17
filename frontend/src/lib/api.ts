import type { Workflow, Step, Execution, Integration, Webhook } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

// --- Workflows ---
export const workflowsApi = {
  list: (params?: Record<string, string>) =>
    request<{ data: Workflow[] }>(`/workflows?${new URLSearchParams(params)}`),

  get: (id: number) =>
    request<{ data: Workflow }>(`/workflows/${id}`),

  create: (data: Partial<Workflow>) =>
    request<{ data: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Workflow>) =>
    request<{ data: Workflow }>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/workflows/${id}`, {
      method: 'DELETE',
    }),

  deploy: (id: number) =>
    request<{ data: Workflow }>(`/workflows/${id}/deploy`, {
      method: 'POST',
    }),

  execute: (id: number) =>
    request<{ data: Execution }>(`/workflows/${id}/execute`, {
      method: 'POST',
    }),

  clone: (id: number) =>
    request<{ data: Workflow }>(`/workflows/${id}/clone`, {
      method: 'POST',
    }),
};

// --- Steps ---
export const stepsApi = {
  list: (workflowId: number) =>
    request<{ data: Step[] }>(`/workflows/${workflowId}/steps`),

  create: (workflowId: number, data: Partial<Step>) =>
    request<{ data: Step }>(`/workflows/${workflowId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (workflowId: number, stepId: number, data: Partial<Step>) =>
    request<{ data: Step }>(`/workflows/${workflowId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (workflowId: number, stepId: number) =>
    request<{ message: string }>(`/workflows/${workflowId}/steps/${stepId}`, {
      method: 'DELETE',
    }),
};

// --- Executions ---
export const executionsApi = {
  list: (workflowId: number) =>
    request<{ data: Execution[] }>(`/workflows/${workflowId}/executions`),

  get: (id: number) =>
    request<{ data: Execution }>(`/executions/${id}`),

  cancel: (id: number) =>
    request<{ data: Execution }>(`/executions/${id}/cancel`, {
      method: 'POST',
    }),
};

// --- Integrations ---
export const integrationsApi = {
  list: () =>
    request<{ data: Integration[] }>('/integrations'),

  connect: (type: string, config: Record<string, any>) =>
    request<{ data: Integration }>(`/integrations/${type}/connect`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

// --- Webhooks ---
export const webhooksApi = {
  list: (workflowId: number) =>
    request<{ data: Webhook[] }>(`/workflows/${workflowId}/webhooks`),

  create: (workflowId: number, stepId: number) =>
    request<{ data: Webhook }>(`/workflows/${workflowId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify({ step_id: stepId }),
    }),

  regenerate: (id: number) =>
    request<{ data: Webhook }>(`/webhooks/${id}/regenerate`, {
      method: 'POST',
    }),

  toggle: (id: number) =>
    request<{ data: Webhook }>(`/webhooks/${id}/toggle`, {
      method: 'POST',
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/webhooks/${id}`, {
      method: 'DELETE',
    }),
};

// --- Queue Monitor ---
export interface QueueStats {
  queues: {
    high: { pending: number; delayed: number; reserved: number; total: number };
    default: { pending: number; delayed: number; reserved: number; total: number };
    low: { pending: number; delayed: number; reserved: number; total: number };
  };
  failed_jobs: number;
  active_workers: number;
  total_queued: number;
}

export interface FailedJob {
  id: number;
  queue: string;
  payload: Record<string, any>;
  failed_at: string;
  error_message?: string;
}

export interface PaginatedFailedJobs {
  data: FailedJob[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const queueApi = {
  stats: () =>
    request<{ data: QueueStats }>('/queue/stats'),

  failed: (page = 1, perPage = 10) =>
    request<PaginatedFailedJobs>(`/queue/failed?page=${page}&per_page=${perPage}`),

  retry: (id: number) =>
    request<{ message: string }>(`/queue/failed/${id}/retry`, {
      method: 'POST',
    }),

  forget: (id: number) =>
    request<{ message: string }>(`/queue/failed/${id}`, {
      method: 'DELETE',
    }),

  retryAll: () =>
    request<{ message: string }>('/queue/failed/retry-all', {
      method: 'POST',
    }),

  forgetAll: () =>
    request<{ message: string }>('/queue/failed/forget-all', {
      method: 'POST',
    }),
};
