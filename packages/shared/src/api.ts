import type { Workflow, WorkflowStep } from './types';

// 127.0.0.1, а не localhost: некоторые браузеры резолвят localhost в IPv6 (::1),
// а бэкенд слушает IPv4 — из-за этого fetch может падать с «Failed to fetch».
const BASE_URL = import.meta.env?.VITE_API_URL ?? 'http://127.0.0.1:4000';

export const DEFAULT_WF = 'wf1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getWorkflow(wfName = DEFAULT_WF): Promise<Workflow> {
    return request<Workflow>(`/workflow/get?wfName=${encodeURIComponent(wfName)}`);
  },

  changeStepXY(
    stepInitialIndex: number,
    x: number,
    y: number,
    wfName = DEFAULT_WF,
  ): Promise<Workflow> {
    return request<Workflow>('/workflow/changeStepXY', {
      method: 'POST',
      body: JSON.stringify({ wfName, stepInitialIndex, x, y }),
    });
  },

  changeStepName(
    stepInitialIndex: number,
    stepName: string,
    wfName = DEFAULT_WF,
  ): Promise<Workflow> {
    return request<Workflow>('/workflow/changeStepName', {
      method: 'POST',
      body: JSON.stringify({ wfName, stepInitialIndex, stepName }),
    });
  },

  createStep(
    stepName: string,
    x: number,
    y: number,
    color: string,
    wfName = DEFAULT_WF,
  ): Promise<WorkflowStep> {
    return request<WorkflowStep>('/workflow/createStep', {
      method: 'POST',
      body: JSON.stringify({ wfName, stepName, x, y, color }),
    });
  },

  // keepalive позволяет запросу пережить закрытие вкладки (коммит отложенного удаления).
  deleteStep(
    stepInitialIndex: number,
    wfName = DEFAULT_WF,
    opts?: { keepalive?: boolean },
  ): Promise<Workflow> {
    return request<Workflow>('/workflow/deleteStep', {
      method: 'POST',
      body: JSON.stringify({ wfName, stepInitialIndex }),
      keepalive: opts?.keepalive,
    });
  },
};
