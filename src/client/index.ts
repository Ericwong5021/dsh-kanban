import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { KanbanFace } from './types.ts'
import { Kanban } from './Kanban.tsx'

export const inject = ['slots', 'sessions', 'workspaces']

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'kanban',
    order: 80,
    inject: (): KanbanFace => ({
      openSession: (sessionId: SessionId) => { ctx.sessions.open(sessionId) },
      clearSession: () => { ctx.sessions.clear() },
      createTask: async (workspaceId: WorkspaceId, title: string, prompt: string) => {
        const sessionId = await ctx.workspaces.connectWorkspace(workspaceId)
        const binding = ctx.sessions.binding(sessionId)
        if (binding === undefined) throw new Error('新会话尚未就绪')
        const renamed = await binding.session.rename(title)
        if (!renamed.ok) throw new Error(renamed.error.message)
        const sent = await binding.session.prompt([{ type: 'text', text: prompt }], 'queue')
        if (!sent.ok) throw new Error(sent.error.message)
        ctx.sessions.open(sessionId)
        return sessionId
      },
    }),
  }, Kanban))
}
