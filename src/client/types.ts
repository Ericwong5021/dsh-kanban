import type { SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'

export type BoardColumnId = 'inbox' | 'ready' | 'running' | 'blocked' | 'done'

export interface KanbanFace {
  openSession: (sessionId: SessionId) => void
  clearSession: () => void
  createTask: (workspaceId: WorkspaceId, title: string, prompt: string) => Promise<SessionId>
}
