import { BookOpen, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { DIFFICULTY_TABLE, type Difficulty } from '../data/gameConfig'
import { STUDY, SUBJECT_COLORS } from '../data/studyConfig'
import { countRoundsOn, totalRoundsOn } from '../engine/study'
import { useRewardEffect } from '../features/effects/useRewardEffect'
import { DraggableTask, TASK_DRAG_TYPE } from '../features/study/LinkedTaskList'
import { getGameDate } from '../lib/date'
import { useGameStore, type SubjectDraft } from '../store/useGameStore'
import type { Subject } from '../types/study'
import type { Task } from '../types/task'

export function StudyPage() {
  const {
    subjects,
    tasks,
    events,
    addSubject,
    updateSubject,
    archiveSubject,
    addRound,
    undoRound,
    assignTaskToSubject,
    completeTask,
  } = useGameStore()
  const today = getGameDate(new Date())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<Subject | undefined>()
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const active = subjects.filter((subject) => !subject.archivedAt)
  const openTasks = tasks.filter(
    (task) => !task.archivedAt && task.type !== 'habit' && !(task.type === 'todo' && task.completedOn),
  )
  const unlinkedTasks = openTasks.filter((task) => !task.subjectId)
  const tasksOf = (subjectId: string) => openTasks.filter((task) => task.subjectId === subjectId)
  const totalRounds = active.reduce((sum, subject) => sum + subject.rounds, 0)
  const roundsToday = totalRoundsOn(events, today)

  return (
    <PageShell
      title="공부"
      description="과목을 등록하고 한 번 볼 때마다 +를 눌러 회독 수를 쌓습니다."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <Panel title={`과목 (${active.length})`}>
          <div className="flex flex-col gap-2">
            {active.length === 0 ? (
              <EmptyState
                message="등록한 과목이 없습니다."
                hint="예: 자료구조 / 시스템 프로그래밍 / 영어 단어장"
              />
            ) : (
              active.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  subjects={active}
                  todayCount={countRoundsOn(events, subject.id, today)}
                  linkedTasks={tasksOf(subject.id)}
                  dragOver={dragOverId === subject.id}
                  onDragOver={(over) => setDragOverId(over ? subject.id : null)}
                  onDropTask={(taskId) => {
                    assignTaskToSubject(taskId, subject.id)
                    setDragOverId(null)
                  }}
                  onAssign={assignTaskToSubject}
                  onCompleteTask={(taskId) => completeTask(taskId)}
                  onAdd={() => addRound(subject.id)}
                  onUndo={() => undoRound(subject.id)}
                  onEdit={() => {
                    setEditing(subject)
                    setFormOpen(true)
                  }}
                  onDelete={() => setConfirmDelete(subject)}
                />
              ))
            )}

            <button
              type="button"
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-abyss-700 py-2 text-sm text-slate-400 hover:border-ember-500 hover:text-ember-400"
            >
              <Plus size={16} aria-hidden />
              과목 추가
            </button>
          </div>
        </Panel>

        <aside className="flex flex-col gap-4">
          <Panel title={`과목 없는 할 일 (${unlinkedTasks.length})`}>
            <p className="-mt-2 mb-2 text-[11px] text-slate-500">
              끌어서 왼쪽 과목 카드에 놓으면 그 과목의 할 일이 됩니다. 드래그가 어려우면 목록의
              과목 선택을 쓰세요.
            </p>
            <ul
              onDragOver={(dragEvent) => dragEvent.preventDefault()}
              onDrop={(dragEvent) => {
                dragEvent.preventDefault()
                const taskId = dragEvent.dataTransfer.getData(TASK_DRAG_TYPE)
                if (taskId) assignTaskToSubject(taskId, null)
              }}
              className="flex min-h-16 flex-col gap-1.5 rounded-lg border border-dashed border-abyss-700 p-2"
            >
              {unlinkedTasks.length === 0 ? (
                <li className="py-2 text-center text-xs text-slate-600">
                  모든 할 일이 과목에 연결되어 있습니다
                </li>
              ) : (
                unlinkedTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    subjects={active}
                    onAssign={(subjectId) => assignTaskToSubject(task.id, subjectId)}
                  />
                ))
              )}
            </ul>
          </Panel>

          <Panel title="요약">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">전체 회독</dt>
                <dd className="tabular-nums text-ember-400">{totalRounds}회</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">오늘 회독</dt>
                <dd className="tabular-nums text-slate-100">{roundsToday}회</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">과목 수</dt>
                <dd className="tabular-nums text-slate-100">{active.length}개</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              회독도 EXP와 Gold를 줍니다. 다만 같은 과목을 하루에 반복하면 보상이 점점 줄어듭니다
              (최소 {Math.round(STUDY.diminishing.floorRatio * 100)}%). 목표 회독을 채우면 보너스{' '}
              {STUDY.targetBonusGold} Gold를 받습니다.
            </p>
          </Panel>

          <Panel title="오늘 기록한 과목">
            {roundsToday === 0 ? (
              <p className="text-sm text-slate-500">아직 없습니다.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {active
                  .map((subject) => ({
                    subject,
                    count: countRoundsOn(events, subject.id, today),
                  }))
                  .filter((row) => row.count > 0)
                  .map(({ subject, count }) => (
                    <li key={subject.id} className="flex justify-between">
                      <span className="text-slate-300">{subject.name}</span>
                      <span className="tabular-nums text-ember-400">{count}회</span>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {formOpen && (
        <SubjectFormModal
          subject={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={(draft) => {
            if (editing) updateSubject(editing.id, draft)
            else addSubject(draft)
          }}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="과목 삭제 확인"
        >
          <div className="w-full max-w-sm rounded-2xl border border-abyss-700 bg-abyss-900 p-5">
            <h2 className="mb-2 text-base font-bold text-slate-100">과목을 삭제할까요?</h2>
            <p className="mb-4 text-sm text-slate-400">
              &lsquo;{confirmDelete.name}&rsquo;을(를) 목록에서 지웁니다. 지난 회독 기록은 그대로
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
                  archiveSubject(confirmDelete.id)
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

function SubjectCard({
  subject,
  subjects,
  todayCount,
  linkedTasks,
  dragOver,
  onDragOver,
  onDropTask,
  onAssign,
  onCompleteTask,
  onAdd,
  onUndo,
  onEdit,
  onDelete,
}: {
  subject: Subject
  subjects: Subject[]
  todayCount: number
  linkedTasks: Task[]
  dragOver: boolean
  onDragOver: (over: boolean) => void
  onDropTask: (taskId: string) => void
  onAssign: (taskId: string, subjectId: string | null) => void
  onCompleteTask: (taskId: string) => void
  onAdd: () => void
  onUndo: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const target = subject.targetRounds
  const progress = target ? Math.min(1, subject.rounds / target) : 0
  const difficulty = DIFFICULTY_TABLE[subject.difficulty]
  const withEffect = useRewardEffect()
  const [flash, setFlash] = useState(false)

  return (
    <article
      onDragOver={(dragEvent) => {
        dragEvent.preventDefault()
        dragEvent.dataTransfer.dropEffect = 'move'
        onDragOver(true)
      }}
      onDragLeave={() => onDragOver(false)}
      onDrop={(dragEvent) => {
        dragEvent.preventDefault()
        const taskId = dragEvent.dataTransfer.getData(TASK_DRAG_TYPE)
        if (taskId) onDropTask(taskId)
      }}
      className={`rounded-xl border p-3 transition-all duration-300 ${
        flash
          ? 'scale-[1.01] border-ember-400 bg-ember-500/10 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
          : dragOver
            ? 'border-ember-400 bg-abyss-700'
            : 'border-abyss-700 bg-abyss-800/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: subject.color }}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{subject.name}</h3>
            <span className="rounded bg-abyss-700 px-1.5 py-0.5 text-[10px] text-slate-300">
              {difficulty.label}
            </span>
            {todayCount > 0 && (
              <span className="rounded bg-ember-500/20 px-1.5 py-0.5 text-[10px] text-ember-400">
                오늘 {todayCount}회
              </span>
            )}
          </div>

          {subject.note && <p className="mt-1 text-xs text-slate-400">{subject.note}</p>}

          {target ? (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>목표 {target}회독</span>
                <span className="tabular-nums">
                  {subject.rounds} / {target}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-abyss-700">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress * 100}%`, backgroundColor: subject.color }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-500">
              <span className="text-mana-400">+{difficulty.exp} EXP</span>{' '}
              <span className="text-gold-400">+{difficulty.gold} G</span> / 회독
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-abyss-900 px-2 py-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={subject.rounds === 0}
              aria-label={`${subject.name} 회독 수 되돌리기`}
              className="rounded p-1 text-slate-500 hover:bg-abyss-700 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus size={14} aria-hidden />
            </button>
            <span className="min-w-8 text-center text-lg font-bold tabular-nums text-slate-100">
              {subject.rounds}
            </span>
            <span className="text-[10px] text-slate-500">회독</span>
            <button
              type="button"
              onClick={(clickEvent) => {
                withEffect(clickEvent.currentTarget, onAdd)
                setFlash(true)
                setTimeout(() => setFlash(false), 450)
              }}
              aria-label={`${subject.name} 회독 1회 추가`}
              className="ml-1 rounded-lg bg-ember-500 p-1.5 text-abyss-950 transition-transform hover:bg-ember-400 active:scale-90"
            >
              <Plus size={16} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onEdit}
            aria-label={`${subject.name} 수정`}
            className="rounded-lg p-2 text-slate-400 hover:bg-abyss-700 hover:text-slate-200"
          >
            <Pencil size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${subject.name} 삭제`}
            className="rounded-lg p-2 text-slate-500 hover:bg-abyss-700 hover:text-vital-400"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>

      {(linkedTasks.length > 0 || dragOver) && (
        <div className="mt-3 border-t border-abyss-700/70 pt-2">
          <p className="mb-1.5 text-[11px] text-slate-500">
            이 과목의 할 일 ({linkedTasks.length})
          </p>
          <ul className="flex flex-col gap-1.5">
            {linkedTasks.map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                subjects={subjects}
                currentSubjectId={subject.id}
                onComplete={() => onCompleteTask(task.id)}
                onAssign={(subjectId) => onAssign(task.id, subjectId)}
              />
            ))}
            {dragOver && (
              <li className="rounded-lg border border-dashed border-ember-400 py-2 text-center text-[11px] text-ember-400">
                여기에 놓기
              </li>
            )}
          </ul>
        </div>
      )}
    </article>
  )
}

function SubjectFormModal({
  subject,
  onClose,
  onSubmit,
}: {
  subject?: Subject
  onClose: () => void
  onSubmit: (draft: SubjectDraft) => void
}) {
  const [name, setName] = useState(subject?.name ?? '')
  const [note, setNote] = useState(subject?.note ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>(subject?.difficulty ?? 3)
  const [target, setTarget] = useState(subject?.targetRounds ? String(subject.targetRounds) : '')
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0])
  const [error, setError] = useState('')

  const handleSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault()
    if (!name.trim()) {
      setError('과목 이름을 입력해 주세요.')
      return
    }
    const parsedTarget = Number(target)
    onSubmit({
      name: name.trim(),
      note: note.trim() || undefined,
      difficulty,
      color,
      ...(target && Number.isFinite(parsedTarget) && parsedTarget > 0
        ? { targetRounds: Math.floor(parsedTarget) }
        : {}),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={subject ? '과목 수정' : '과목 추가'}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-abyss-700 bg-abyss-900 p-5"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <BookOpen size={18} aria-hidden className="text-ember-400" />
          {subject ? '과목 수정' : '과목 추가'}
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">과목 이름</span>
          <input
            value={name}
            onChange={(changeEvent) => setName(changeEvent.target.value)}
            placeholder="예: 시스템 프로그래밍"
            className="w-full rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            autoFocus
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">메모 (선택)</span>
          <input
            value={note}
            onChange={(changeEvent) => setNote(changeEvent.target.value)}
            placeholder="교재나 범위"
            className="w-full rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>

        <fieldset className="mb-3">
          <legend className="mb-1 text-sm text-slate-300">한 회독의 무게</legend>
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

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">목표 회독 수 (선택)</span>
          <input
            value={target}
            onChange={(changeEvent) => setTarget(changeEvent.target.value)}
            inputMode="numeric"
            placeholder="예: 3"
            className="w-24 rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-sm text-slate-300">색</legend>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`색 ${value}`}
                aria-pressed={color === value}
                onClick={() => setColor(value)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  color === value ? 'scale-110 border-slate-100' : 'border-transparent'
                }`}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
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
            {subject ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
