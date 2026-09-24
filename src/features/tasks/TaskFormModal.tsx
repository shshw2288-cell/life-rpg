import { useEffect, useState } from 'react'
import { DIFFICULTY_TABLE, type Difficulty } from '../../data/gameConfig'
import { WEEKDAY_LABELS } from '../../lib/date'
import type { Task, TaskType } from '../../types/task'
import type { TaskDraft } from '../../store/useGameStore'

interface TaskFormModalProps {
  open: boolean
  initialType: TaskType
  /** 수정 모드면 기존 과제 */
  task?: Task
  onClose: () => void
  onSubmit: (draft: TaskDraft) => void
}

const TYPE_LABEL: Record<TaskType, string> = {
  habit: '습관',
  daily: '반복 과제',
  todo: '할 일',
}

const METRIC_PRESETS = ['분', '회', 'km', '페이지', 'kg']

export function TaskFormModal({ open, initialType, task, onClose, onSubmit }: TaskFormModalProps) {
  const [type, setType] = useState<TaskType>(initialType)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(3)
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [dueDate, setDueDate] = useState('')
  const [polarity, setPolarity] = useState<'positive' | 'negative' | 'both'>('positive')
  const [useMetric, setUseMetric] = useState(false)
  const [metricUnit, setMetricUnit] = useState('분')
  const [metricTarget, setMetricTarget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (task) {
      setType(task.type)
      setTitle(task.title)
      setDescription(task.description ?? '')
      setDifficulty(task.difficulty)
      setUseMetric(Boolean(task.metric))
      setMetricUnit(task.metric?.unit ?? '분')
      setMetricTarget(task.metric?.target ? String(task.metric.target) : '')
      if (task.type === 'daily') setRepeatDays(task.repeatDays)
      if (task.type === 'todo') setDueDate(task.dueDate ?? '')
      if (task.type === 'habit') setPolarity(task.polarity)
    } else {
      setType(initialType)
      setTitle('')
      setDescription('')
      setDifficulty(3)
      setRepeatDays([])
      setDueDate('')
      setPolarity('positive')
      setUseMetric(false)
      setMetricUnit('분')
      setMetricTarget('')
    }
    setError('')
  }, [open, task, initialType])

  if (!open) return null

  const handleSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }

    const metric = useMetric
      ? {
          unit: metricUnit.trim() || '회',
          ...(metricTarget ? { target: Number(metricTarget) } : {}),
        }
      : undefined

    const shared = {
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      metric,
    }

    if (type === 'habit') {
      onSubmit({ ...shared, type: 'habit', polarity } as TaskDraft)
    } else if (type === 'daily') {
      onSubmit({ ...shared, type: 'daily', repeatDays } as TaskDraft)
    } else {
      onSubmit({ ...shared, type: 'todo', dueDate: dueDate || undefined } as TaskDraft)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={task ? '과제 수정' : '과제 추가'}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-abyss-700 bg-abyss-900 p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-bold text-slate-100">
          {task ? '과제 수정' : '새 과제 추가'}
        </h2>

        {!task && (
          <div className="mb-4 flex gap-2">
            {(['habit', 'daily', 'todo'] as TaskType[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  type === value
                    ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                    : 'border-abyss-700 text-slate-300 hover:bg-abyss-800'
                }`}
              >
                {TYPE_LABEL[value]}
              </button>
            ))}
          </div>
        )}

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">제목</span>
          <input
            value={title}
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
            placeholder="예: 운동하기"
            className="w-full rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            autoFocus
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">설명 (선택)</span>
          <textarea
            value={description}
            onChange={(changeEvent) => setDescription(changeEvent.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <fieldset className="mb-3">
          <legend className="mb-1 text-sm text-slate-300">난이도</legend>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as Difficulty[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  difficulty === value
                    ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                    : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
                }`}
              >
                {DIFFICULTY_TABLE[value].label}
                <span className="ml-1 text-[10px] text-slate-500">
                  {DIFFICULTY_TABLE[value].exp}xp
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {type === 'habit' && (
          <fieldset className="mb-3">
            <legend className="mb-1 text-sm text-slate-300">습관 종류</legend>
            <div className="flex gap-2">
              {(
                [
                  { value: 'positive', label: '좋은 습관 (+)' },
                  { value: 'negative', label: '나쁜 습관 (−)' },
                  { value: 'both', label: '둘 다' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPolarity(option.value)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                    polarity === option.value
                      ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                      : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {type === 'daily' && (
          <fieldset className="mb-3">
            <legend className="mb-1 text-sm text-slate-300">
              수행 요일 <span className="text-xs text-slate-500">(선택 안 하면 매일)</span>
            </legend>
            <div className="flex gap-1.5">
              {WEEKDAY_LABELS.map((label, index) => {
                const selected = repeatDays.includes(index)
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setRepeatDays((prev) =>
                        selected ? prev.filter((day) => day !== index) : [...prev, index].sort(),
                      )
                    }
                    className={`h-9 w-9 rounded-lg border text-xs transition-colors ${
                      selected
                        ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                        : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {type === 'todo' && (
          <label className="mb-3 block">
            <span className="mb-1 block text-sm text-slate-300">마감일 (선택)</span>
            <input
              type="date"
              value={dueDate}
              onChange={(changeEvent) => setDueDate(changeEvent.target.value)}
              className="rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        )}

        <fieldset className="mb-4 rounded-lg border border-abyss-700 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={useMetric}
              onChange={(changeEvent) => setUseMetric(changeEvent.target.checked)}
              className="h-4 w-4 accent-ember-400"
            />
            수치 기록하기 (운동 시간, 횟수, 거리 등)
          </label>

          {useMetric && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {METRIC_PRESETS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setMetricUnit(unit)}
                    className={`rounded-md border px-2.5 py-1 text-xs ${
                      metricUnit === unit
                        ? 'border-ember-400 text-ember-400'
                        : 'border-abyss-700 text-slate-400'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={metricUnit}
                  onChange={(changeEvent) => setMetricUnit(changeEvent.target.value)}
                  placeholder="단위"
                  className="w-24 rounded-lg border border-abyss-700 bg-abyss-950 px-2 py-1.5 text-sm text-slate-100"
                  aria-label="단위"
                />
                <input
                  value={metricTarget}
                  onChange={(changeEvent) => setMetricTarget(changeEvent.target.value)}
                  placeholder="목표 (선택)"
                  inputMode="numeric"
                  className="w-32 rounded-lg border border-abyss-700 bg-abyss-950 px-2 py-1.5 text-sm text-slate-100"
                  aria-label="목표 수치"
                />
              </div>
              <p className="text-xs text-slate-500">
                완료할 때 값을 입력하면 기록 화면에 합계가 쌓입니다.
              </p>
            </div>
          )}
        </fieldset>

        {error && <p className="mb-3 text-sm text-vital-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-abyss-800"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded-lg bg-ember-500 px-4 py-2 text-sm font-semibold text-abyss-950 hover:bg-ember-400"
          >
            {task ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
