import type { Workflow, Step, Execution, Integration } from '@/types';

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
