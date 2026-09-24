import { Check, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DIFFICULTY_TABLE } from '../../data/gameConfig'
import { WEEKDAY_LABELS } from '../../lib/date'
import type { Task } from '../../types/task'

interface TaskCardProps {
  task: Task
  /** 오늘 이미 완료했는가 (반복 과제·할 일) */
  done?: boolean
  /** 오늘 기록 횟수 (습관) */
  todayCount?: number
  onComplete?: (metricValue?: number) => void
  onHabit?: (polarity: 'positive' | 'negative') => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskCard({
  task,
  done = false,
  todayCount = 0,
  onComplete,
  onHabit,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [metricInput, setMetricInput] = useState('')
  const [askMetric, setAskMetric] = useState(false)
  const difficulty = DIFFICULTY_TABLE[task.difficulty]

  const handleComplete = () => {
    if (task.metric && !askMetric) {
      setAskMetric(true)
      return
    }
    const value = task.metric ? Number(metricInput) : undefined
    onComplete?.(Number.isFinite(value) && value !== undefined && value > 0 ? value : undefined)
    setAskMetric(false)
    setMetricInput('')
  }

  return (
    <article
      className={`rounded-xl border p-3 transition-colors ${
        done ? 'border-abyss-800 bg-abyss-900/40' : 'border-abyss-700 bg-abyss-800/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-semibold ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}
            >
              {task.title}
            </h3>
            <span className="rounded bg-abyss-700 px-1.5 py-0.5 text-[10px] text-slate-300">
              {difficulty.label}
            </span>
            {task.metric && (
              <span className="rounded bg-mana-500/20 px-1.5 py-0.5 text-[10px] text-mana-400">
                {task.metric.unit} 기록
                {task.metric.target ? ` · 목표 ${task.metric.target}` : ''}
              </span>
            )}
            {done && <span className="text-[10px] text-slate-500">오늘 완료</span>}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-slate-400">{task.description}</p>
          )}

          <p className="mt-1.5 text-[11px] text-slate-500">
            {task.type === 'daily' &&
              (task.repeatDays.length === 0
                ? '매일'
                : task.repeatDays.map((day) => WEEKDAY_LABELS[day]).join('·'))}
            {task.type === 'todo' && (task.dueDate ? `마감 ${task.dueDate}` : '마감 없음')}
            {task.type === 'habit' && `오늘 ${todayCount}회 기록`}
            {' · '}
            <span className="text-mana-400">+{difficulty.exp} EXP</span>{' '}
            <span className="text-gold-400">+{difficulty.gold} G</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {task.type === 'habit' && onHabit && (
            <>
              {task.polarity !== 'negative' && (
                <button
                  type="button"
                  onClick={() => onHabit('positive')}
                  aria-label={`${task.title} 좋은 습관 기록`}
                  className="rounded-lg bg-emerald-600/80 p-2 text-white hover:bg-emerald-500"
                >
                  <Plus size={16} aria-hidden />
                </button>
              )}
              {task.polarity !== 'positive' && (
                <button
                  type="button"
                  onClick={() => onHabit('negative')}
                  aria-label={`${task.title} 나쁜 습관 기록`}
                  className="rounded-lg bg-vital-500/80 p-2 text-white hover:bg-vital-400"
                >
                  <Minus size={16} aria-hidden />
                </button>
              )}
            </>
          )}

          {task.type !== 'habit' && onComplete && !done && (
            <button
              type="button"
              onClick={handleComplete}
              aria-label={`${task.title} 완료`}
              className="rounded-lg bg-ember-500 p-2 text-abyss-950 hover:bg-ember-400"
            >
              <Check size={16} aria-hidden />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`${task.title} 수정`}
              className="rounded-lg p-2 text-slate-400 hover:bg-abyss-700 hover:text-slate-200"
            >
              <Pencil size={15} aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${task.title} 삭제`}
              className="rounded-lg p-2 text-slate-500 hover:bg-abyss-700 hover:text-vital-400"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {askMetric && task.metric && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-abyss-950 p-2">
          <label className="text-xs text-slate-300" htmlFor={`metric-${task.id}`}>
            오늘 기록
          </label>
          <input
            id={`metric-${task.id}`}
            value={metricInput}
            onChange={(changeEvent) => setMetricInput(changeEvent.target.value)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === 'Enter') handleComplete()
            }}
            inputMode="decimal"
            placeholder={task.metric.target ? String(task.metric.target) : '0'}
            className="w-20 rounded-md border border-abyss-700 bg-abyss-900 px-2 py-1 text-sm text-slate-100"
            autoFocus
          />
          <span className="text-xs text-slate-400">{task.metric.unit}</span>
          <button
            type="button"
            onClick={handleComplete}
            className="ml-auto rounded-md bg-ember-500 px-3 py-1 text-xs font-semibold text-abyss-950"
          >
            기록하고 완료
          </button>
          <button
            type="button"
            onClick={() => setAskMetric(false)}
            className="rounded-md px-2 py-1 text-xs text-slate-400"
          >
            취소
          </button>
        </div>
      )}
    </article>
  )
}
