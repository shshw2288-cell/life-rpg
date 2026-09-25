import { Check, GripVertical, X } from 'lucide-react'
import { DIFFICULTY_TABLE } from '../../data/gameConfig'
import type { Subject } from '../../types/study'
import type { Task } from '../../types/task'

export const TASK_DRAG_TYPE = 'application/x-life-rpg-task'

/** 드래그할 수 있는 할 일 한 줄 */
export function DraggableTask({
  task,
  subjects,
  currentSubjectId,
  onComplete,
  onAssign,
}: {
  task: Task
  subjects: Subject[]
  currentSubjectId?: string
  onComplete?: () => void
  onAssign: (subjectId: string | null) => void
}) {
  const difficulty = DIFFICULTY_TABLE[task.difficulty]
  const done = task.type === 'todo' && Boolean(task.completedOn)

  return (
    <li
      draggable
      onDragStart={(dragEvent) => {
        dragEvent.dataTransfer.setData(TASK_DRAG_TYPE, task.id)
        dragEvent.dataTransfer.setData('text/plain', task.id)
        dragEvent.dataTransfer.effectAllowed = 'move'
      }}
      className={`group flex items-center gap-2 rounded-lg border border-abyss-700 bg-abyss-800/70 px-2 py-1.5 ${
        done ? 'opacity-50' : 'cursor-grab active:cursor-grabbing hover:border-ember-500/60'
      }`}
    >
      <GripVertical size={14} aria-hidden className="shrink-0 text-slate-600" />

      <span className={`min-w-0 flex-1 truncate text-xs ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
        {task.title}
        <span className="ml-1.5 text-[10px] text-slate-500">{difficulty.label}</span>
      </span>

      {/* 드래그가 어려운 환경(터치·키보드)을 위한 대체 수단 */}
      <select
        value={currentSubjectId ?? ''}
        onChange={(changeEvent) => onAssign(changeEvent.target.value || null)}
        aria-label={`${task.title} 과목 선택`}
        className="max-w-24 shrink-0 rounded border border-abyss-700 bg-abyss-950 px-1 py-0.5 text-[10px] text-slate-300"
      >
        <option value="">과목 없음</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>

      {onComplete && !done && (
        <button
          type="button"
          onClick={onComplete}
          aria-label={`${task.title} 완료`}
          className="shrink-0 rounded bg-ember-500 p-1 text-abyss-950 hover:bg-ember-400"
        >
          <Check size={12} aria-hidden />
        </button>
      )}

      {currentSubjectId && (
        <button
          type="button"
          onClick={() => onAssign(null)}
          aria-label={`${task.title} 과목 연결 해제`}
          className="shrink-0 rounded p-1 text-slate-500 hover:bg-abyss-700 hover:text-vital-400"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </li>
  )
}
