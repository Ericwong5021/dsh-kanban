import { useMemo, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import {
  Button, IconChecklistOutline14, IconCloseOutline16, IconNewChatOutline16,
  IconPlusOutline16, Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { SessionId, SessionSummary, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type { BoardColumnId, TaskboardFace } from './types.ts'
import css from './Taskboard.module.css'

type Props = PropsRuntime<'sidebar.footer.action'> & InjectFace<TaskboardFace>

const columns: ReadonlyArray<{ id: BoardColumnId; label: string }> = [
  { id: 'inbox', label: '收件箱' },
  { id: 'ready', label: '待开始' },
  { id: 'running', label: '进行中' },
  { id: 'blocked', label: '需处理' },
  { id: 'done', label: '已完成' },
]

const storageKey = 'dsh-taskboard.columns.v1'

function loadOverrides(): Record<string, BoardColumnId> {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, BoardColumnId>
  } catch {
    return {}
  }
}

function automaticColumn(session: SessionSummary): BoardColumnId {
  if (session.pendingInteraction !== undefined) return 'blocked'
  if (session.running) return 'running'
  if (session.completed) return 'done'
  if (session.blank) return 'inbox'
  return 'ready'
}

function relativeTime(time: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000))
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  return `${Math.floor(seconds / 86400)} 天前`
}

export function Taskboard({ wide, useSessions, useWorkspaces, openSession, createTask }: Props) {
  const sessions = useSessions(state => state)
  const workspaces = useWorkspaces(state => state.items)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [overrides, setOverrides] = useState(loadOverrides)
  const [query, setQuery] = useState('')
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId | ''>('')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const visible = useMemo(() => sessions.ids
    .map(id => sessions.byId[id])
    .filter((session): session is SessionSummary => session !== undefined)
    .filter(session => query === '' || `${session.displayTitle} ${session.cwd ?? ''}`.toLowerCase().includes(query.toLowerCase())),
  [sessions, query])

  const move = (sessionId: SessionId, column: BoardColumnId) => {
    const next = { ...overrides, [sessionId]: column }
    setOverrides(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (workspaceId === '' || title.trim() === '' || prompt.trim() === '') return
    setError('')
    try {
      await createTask(workspaceId, title.trim(), prompt.trim())
      setCreating(false)
      setTitle('')
      setPrompt('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  return (
    <div className={`${css.entry} ${wide ? '' : css.rail}`}>
      <button type="button" className={css.trigger} aria-label="打开任务看板" onClick={() => setOpen(true)}>
        <IconChecklistOutline14 size={16} />
        {wide && <span>任务看板</span>}
        {wide && <span className={css.total}>{sessions.ids.length}</span>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="任务看板" className={css.modalShell} headless>
        <section className={css.surface} lang="zh-CN">
          <header className={css.header}>
            <div className={css.heading}>
              <span className={css.mark}><IconChecklistOutline14 size={18} /></span>
              <div>
                <h1>任务看板</h1>
                <p>DeepSeek Harness 会话工作流</p>
              </div>
            </div>
            <div className={css.headerActions}>
              <label className={css.search}>
                <span>⌕</span>
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索任务" aria-label="搜索任务" />
              </label>
              <Button variant="primary" size="sm" icon={<IconPlusOutline16 size={14} />} onClick={() => setCreating(true)}>新建任务</Button>
              <button type="button" className={css.close} aria-label="关闭任务看板" onClick={() => setOpen(false)}><IconCloseOutline16 size={16} /></button>
            </div>
          </header>
          <div className={css.board}>
            {columns.map(column => {
              const items = visible.filter(session => (overrides[session.id] ?? automaticColumn(session)) === column.id)
              return (
                <section
                  className={css.column}
                  key={column.id}
                  data-column={column.id}
                  onDragOver={(event: DragEvent) => event.preventDefault()}
                  onDrop={(event: DragEvent) => {
                    event.preventDefault()
                    move(event.dataTransfer.getData('text/plain') as SessionId, column.id)
                  }}
                >
                  <header className={css.columnHeader}>
                    <span className={css.dot} />
                    <h2>{column.label}</h2>
                    <span>{items.length}</span>
                  </header>
                  <div className={css.cards}>
                    {items.map(session => (
                      <article
                        role="button"
                        tabIndex={0}
                        className={css.card}
                        key={session.id}
                        draggable
                        onDragStart={event => event.dataTransfer.setData('text/plain', session.id)}
                        onClick={() => { openSession(session.id); setOpen(false) }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openSession(session.id)
                            setOpen(false)
                          }
                        }}
                      >
                        <div className={css.cardTop}>
                          <span className={css.cardStatus}>{session.running ? '执行中' : session.pendingInteraction !== undefined ? '等待输入' : session.completed ? '已完成' : '会话'}</span>
                          <span className={css.time}>{relativeTime(session.updatedAt)}</span>
                        </div>
                        <h3>{session.blank ? '新任务' : session.displayTitle}</h3>
                        <p>{session.cwd ?? '未关联工作区'}</p>
                        <footer>
                          <span>{session.agentPreset ?? 'default'}</span>
                          {session.running && <span className={css.live}>● LIVE</span>}
                        </footer>
                      </article>
                    ))}
                    {items.length === 0 && <div className={css.empty}>拖动任务到这里</div>}
                  </div>
                </section>
              )
            })}
          </div>
          <footer className={css.boardFooter}>
            <span><i className={css.syncDot} /> 已连接 Harness</span>
            <span>{visible.length} 个任务</span>
          </footer>
          {creating && (
            <div className={css.createLayer}>
              <form className={css.createCard} onSubmit={submit}>
                <div className={css.createHead}>
                  <div><IconNewChatOutline16 size={18} /><h2>新建任务</h2></div>
                  <button type="button" aria-label="关闭新建任务" onClick={() => setCreating(false)}><IconCloseOutline16 size={16} /></button>
                </div>
                <label>工作区
                  <select value={workspaceId} onChange={event => setWorkspaceId(event.target.value as WorkspaceId)} required>
                    <option value="">选择工作区</option>
                    {workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.title}</option>)}
                  </select>
                </label>
                <label>任务标题<input value={title} onChange={event => setTitle(event.target.value)} placeholder="例如：修复登录回归" required /></label>
                <label>交给 DeepSeek 的任务<textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="描述目标、约束和验收条件" rows={6} required /></label>
                {error !== '' && <p className={css.error}>{error}</p>}
                <div className={css.createActions}>
                  <Button size="sm" onClick={() => setCreating(false)}>取消</Button>
                  <Button type="submit" variant="primary" size="sm" disabled={workspaceId === '' || title.trim() === '' || prompt.trim() === ''}>创建并运行</Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </Modal>
    </div>
  )
}
