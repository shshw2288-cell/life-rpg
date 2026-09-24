import { Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { TaskCard } from '../features/tasks/TaskCard'
import { TaskFormModal } from '../features/tasks/TaskFormModal'
import { countHabitEvents, hasCompletedOn } from '../engine/ledger'
import { getGameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'
import type { Task, TaskType } from '../types/task'

const SECTIONS: { type: TaskType; title: string; hint: string }[] = [
  { type: 'habit', title: '습관', hint: '횟수 제한 없이 기록하는 행동' },
  { type: 'daily', title: '반복 과제', hint: '정해진 요일마다 해야 하는 일' },
  { type: 'todo', title: '할 일', hint: '한 번 끝내면 되는 일' },
]

export function TasksPage() {
  const tasks = useGameStore((state) => state.tasks)
  const events = useGameStore((state) => state.events)
  const addTask = useGameStore((state) => state.addTask)
  const updateTask = useGameStore((state) => state.updateTask)
  const archiveTask = useGameStore((state) => state.archiveTask)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<TaskType>('daily')
  const [editing, setEditing] = useState<Task | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<Task | undefined>()

  const today = getGameDate(new Date())
  const active = tasks.filter((task) => !task.archivedAt)

  const openCreate = (type: TaskType) => {
    setEditing(undefined)
    setModalType(type)
    setModalOpen(true)
  }

  return (
    <PageShell title="과제 관리" description="습관, 반복 과제, 할 일을 직접 등록하고 수정합니다.">
      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const items = active.filter((task) => task.type === section.type)
          return (
            <Panel key={section.type} title={`${section.title} (${items.length})`}>
              <p className="-mt-2 mb-3 text-xs text-slate-500">{section.hint}</p>

              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <EmptyState message={`등록한 ${section.title}이(가) 없습니다.`} />
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      done={
                        task.type === 'todo'
                          ? Boolean(task.completedOn)
                          : task.type === 'daily'
                            ? hasCompletedOn(events, task.id, today)
                            : false
                      }
                      todayCount={
                        task.type === 'habit'
                          ? countHabitEvents(events, task.id, today, 'positive')
                          : 0
                      }
                      onEdit={() => {
                        setEditing(task)
                        setModalType(task.type)
                        setModalOpen(true)
                      }}
                      onDelete={() => setConfirmDelete(task)}
                    />
                  ))
                )}

                <button
                  type="button"
                  onClick={() => openCreate(section.type)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-abyss-700 py-2 text-sm text-slate-400 hover:border-ember-500 hover:text-ember-400"
                >
                  <Plus size={16} aria-hidden />
                  {section.title} 추가
                </button>
              </div>
            </Panel>
          )
        })}
      </div>

      <TaskFormModal
        open={modalOpen}
        initialType={modalType}
        task={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={(draft) => {
          if (editing) updateTask(editing.id, draft as Partial<Task>)
          else addTask(draft)
        }}
      />

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="삭제 확인"
        >
          <div className="w-full max-w-sm rounded-2xl border border-abyss-700 bg-abyss-900 p-5">
            <h2 className="mb-2 text-base font-bold text-slate-100">과제를 삭제할까요?</h2>
            <p className="mb-4 text-sm text-slate-400">
              &lsquo;{confirmDelete.title}&rsquo;을(를) 목록에서 지웁니다. 지난 기록은 그대로
              남습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(undefined)}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-abyss-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  archiveTask(confirmDelete.id)
                  setConfirmDelete(undefined)
                }}
                className="rounded-lg bg-vital-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vital-400"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
