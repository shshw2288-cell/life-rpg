import { Minus, Plus, Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { BIG_THREE, GROUPS, WEIGHT_STEP, findGroup } from '../data/workoutConfig'
import { MuscleIllustration } from '../features/workout/MuscleIllustration'
import { useGameStore } from '../store/useGameStore'
import type { MuscleGroup, WorkoutExercise } from '../types/workout'

export function WorkoutPage() {
  const {
    workout,
    addExercise,
    adjustExerciseWeight,
    setExerciseWeight,
    removeExercise,
    adjustBigThree,
    setBigThree,
  } = useGameStore()

  const [selected, setSelected] = useState<MuscleGroup>('chest')
  const [newName, setNewName] = useState('')

  const group = findGroup(selected)
  const exercisesOf = (id: MuscleGroup) =>
    workout.exercises.filter((exercise) => !exercise.archivedAt && exercise.group === id)
  const current = exercisesOf(selected)

  const bigThreeTotal = BIG_THREE.reduce((sum, lift) => sum + workout.bigThree[lift.id], 0)
  const bestTotal = BIG_THREE.reduce((sum, lift) => sum + (workout.bigThreeBest[lift.id] ?? 0), 0)

  return (
    <PageShell title="운동" description="부위를 고르고 종목별 무게를 기록합니다.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {/* 부위 카드 4개 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GROUPS.map((item) => {
              const isSelected = item.id === selected
              const list = exercisesOf(item.id)
              const heaviest = list.reduce((max, exercise) => Math.max(max, exercise.weight), 0)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  aria-pressed={isSelected}
                  className={`flex aspect-square flex-col items-center justify-between rounded-2xl border-2 p-3 transition-colors ${
                    isSelected
                      ? 'border-ember-400 bg-abyss-700'
                      : 'border-abyss-700 bg-abyss-900 hover:border-abyss-600 hover:bg-abyss-800'
                  }`}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: isSelected ? item.color : '#cbd5e1' }}
                  >
                    {item.name}
                  </span>

                  <MuscleIllustration
                    group={item.id}
                    color={item.color}
                    size={72}
                    dim={!isSelected}
                  />

                  <span className="text-[11px] text-slate-500">
                    {list.length === 0 ? '종목 없음' : `${list.length}종목 · 최대 ${heaviest}kg`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 선택한 부위의 종목별 무게 */}
          <Panel title={`${group.name} 종목 (${current.length})`}>
            <p className="-mt-2 mb-3 text-xs text-slate-500">{group.description}</p>

            <div className="flex flex-col gap-2">
              {current.length === 0 ? (
                <EmptyState message={`${group.name} 종목이 없습니다.`} hint="아래에서 추가하세요." />
              ) : (
                current.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    color={group.color}
                    onAdjust={(delta) => adjustExerciseWeight(exercise.id, delta)}
                    onSet={(weight) => setExerciseWeight(exercise.id, weight)}
                    onRemove={() => removeExercise(exercise.id)}
                  />
                ))
              )}
            </div>

            <div className="mt-4 border-t border-abyss-700 pt-3">
              <form
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault()
                  addExercise(selected, newName)
                  setNewName('')
                }}
                className="flex gap-2"
              >
                <input
                  value={newName}
                  onChange={(changeEvent) => setNewName(changeEvent.target.value)}
                  placeholder={`${group.name} 종목 이름`}
                  aria-label="새 종목 이름"
                  className="min-w-0 flex-1 rounded-lg border border-abyss-700 bg-abyss-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-ember-500 px-4 py-2 text-sm font-semibold text-abyss-950 hover:bg-ember-400"
                >
                  추가
                </button>
              </form>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.presets
                  .filter((preset) => !current.some((exercise) => exercise.name === preset))
                  .map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addExercise(selected, preset)}
                      className="rounded-md border border-abyss-700 px-2 py-1 text-[11px] text-slate-400 hover:border-ember-500 hover:text-ember-400"
                    >
                      + {preset}
                    </button>
                  ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* 3대 기록 */}
        <aside className="flex flex-col gap-4">
          <Panel title="3대 기록">
            <div className="flex flex-col gap-3">
              {BIG_THREE.map((lift) => {
                const weight = workout.bigThree[lift.id]
                const best = workout.bigThreeBest[lift.id] ?? 0
                const isBest = weight > 0 && weight >= best

                return (
                  <div
                    key={lift.id}
                    className="rounded-xl border border-abyss-700 bg-abyss-800/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: lift.color }}>
                        {lift.name}
                      </span>
                      {best > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Trophy size={11} aria-hidden />
                          최고 {best}kg
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustBigThree(lift.id, -WEIGHT_STEP)}
                        disabled={weight === 0}
                        aria-label={`${lift.name} ${WEIGHT_STEP}kg 빼기`}
                        className="rounded-lg bg-abyss-700 p-2 text-slate-300 hover:bg-abyss-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={16} aria-hidden />
                      </button>

                      <div className="flex flex-1 items-baseline justify-center gap-1">
                        <input
                          value={weight}
                          onChange={(changeEvent) =>
                            setBigThree(lift.id, Number(changeEvent.target.value) || 0)
                          }
                          inputMode="decimal"
                          aria-label={`${lift.name} 무게`}
                          className="w-16 bg-transparent text-center text-2xl font-bold tabular-nums text-slate-100 outline-none"
                        />
                        <span className="text-xs text-slate-500">kg</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => adjustBigThree(lift.id, WEIGHT_STEP)}
                        aria-label={`${lift.name} ${WEIGHT_STEP}kg 더하기`}
                        className="rounded-lg bg-ember-500 p-2 text-abyss-950 hover:bg-ember-400"
                      >
                        <Plus size={16} aria-hidden />
                      </button>
                    </div>

                    {isBest && best > 0 && (
                      <p className="mt-1.5 text-center text-[11px] text-ember-400">최고 기록!</p>
                    )}
                  </div>
                )
              })}
            </div>

            <dl className="mt-3 space-y-1.5 border-t border-abyss-700 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">3대 합계</dt>
                <dd className="text-lg font-bold tabular-nums text-ember-400">{bigThreeTotal}kg</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">최고 합계</dt>
                <dd className="tabular-nums text-slate-300">{bestTotal}kg</dd>
              </div>
            </dl>

            <p className="mt-3 text-[11px] text-slate-500">
              + / − 를 누르면 {WEIGHT_STEP}kg씩 움직입니다. 숫자를 눌러 직접 입력할 수도 있습니다.
            </p>
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}

function ExerciseRow({
  exercise,
  color,
  onAdjust,
  onSet,
  onRemove,
}: {
  exercise: WorkoutExercise
  color: string
  onAdjust: (delta: number) => void
  onSet: (weight: number) => void
  onRemove: () => void
}) {
  const isBest = exercise.weight > 0 && exercise.weight >= exercise.best

  return (
    <div className="flex items-center gap-3 rounded-xl border border-abyss-700 bg-abyss-800/60 p-3">
      <span
        className="h-8 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">{exercise.name}</p>
        <p className="text-[11px] text-slate-500">
          최고 {exercise.best}kg
          {exercise.updatedOn && ` · ${exercise.updatedOn} 갱신`}
          {isBest && exercise.best > 0 && <span className="ml-1 text-ember-400">최고 기록</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAdjust(-WEIGHT_STEP)}
          disabled={exercise.weight === 0}
          aria-label={`${exercise.name} ${WEIGHT_STEP}kg 빼기`}
          className="rounded-lg bg-abyss-700 p-1.5 text-slate-300 hover:bg-abyss-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={14} aria-hidden />
        </button>

        <div className="flex items-baseline gap-0.5">
          <input
            value={exercise.weight}
            onChange={(changeEvent) => onSet(Number(changeEvent.target.value) || 0)}
            inputMode="decimal"
            aria-label={`${exercise.name} 무게`}
            className="w-12 bg-transparent text-right text-lg font-bold tabular-nums text-slate-100 outline-none"
          />
          <span className="text-[11px] text-slate-500">kg</span>
        </div>

        <button
          type="button"
          onClick={() => onAdjust(WEIGHT_STEP)}
          aria-label={`${exercise.name} ${WEIGHT_STEP}kg 더하기`}
          className="rounded-lg bg-ember-500 p-1.5 text-abyss-950 hover:bg-ember-400"
        >
          <Plus size={14} aria-hidden />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`${exercise.name} 삭제`}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-abyss-700 hover:text-vital-400"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}
