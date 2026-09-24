import { Link } from 'react-router-dom'
import { LumiAvatar } from '../components/character/LumiAvatar'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { TaskCard } from '../features/tasks/TaskCard'
import { stageForLevel } from '../engine/evolution'
import { countHabitEvents, hasCompletedOn, totalsForDate } from '../engine/ledger'
import { calcStreak, dailiesFor } from '../engine/schedule'
import { formatDisplayDate, getGameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'

export function DashboardPage() {
  const { tasks, events, character, eggs, completeTask, recordHabit } = useGameStore()
  const today = getGameDate(new Date())

  const active = tasks.filter((task) => !task.archivedAt)
  const dailies = dailiesFor(active, today)
  const habits = active.filter((task) => task.type === 'habit')
  const todos = active.filter((task) => task.type === 'todo' && !task.completedOn)

  const totals = totalsForDate(events, today)
  const streak = calcStreak(events, today)
  const stage = stageForLevel(character.level)
  const metricToday = events
    .filter((event) => event.localDate === today && event.metricValue)
    .map((event) => `${event.metricValue}${event.metricUnit ?? ''}`)

  return (
    <PageShell title="오늘의 퀘스트" description={`${formatDisplayDate(today)} 기준`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Panel title={`반복 과제 (${dailies.length})`}>
            <div className="flex flex-col gap-2">
              {dailies.length === 0 ? (
                <EmptyState
                  message="오늘 예정된 반복 과제가 없습니다."
                  hint="과제 관리 화면에서 추가할 수 있습니다."
                />
              ) : (
                dailies.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={hasCompletedOn(events, task.id, today)}
                    onComplete={(metricValue) => completeTask(task.id, metricValue)}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel title={`습관 (${habits.length})`}>
            <div className="flex flex-col gap-2">
              {habits.length === 0 ? (
                <EmptyState message="등록한 습관이 없습니다." />
              ) : (
                habits.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    todayCount={countHabitEvents(events, task.id, today, 'positive')}
                    onHabit={(polarity) => recordHabit(task.id, polarity)}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel title={`할 일 (${todos.length})`}>
            <div className="flex flex-col gap-2">
              {todos.length === 0 ? (
                <EmptyState message="남아 있는 할 일이 없습니다." />
              ) : (
                todos.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={(metricValue) => completeTask(task.id, metricValue)}
                  />
                ))
              )}
            </div>
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel title="내 루미">
            <Link to="/character" className="flex flex-col items-center gap-2">
              <LumiAvatar stage={stage} size={150} fainted={character.hp <= character.maxHp * 0.2} />
              <p className="text-sm font-semibold text-slate-100">{stage.name}</p>
              <p className="text-xs text-slate-500">Lv.{character.level} · 자세히 보기</p>
            </Link>
          </Panel>

          <Panel title="오늘의 성과">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">획득 EXP</dt>
                <dd className="tabular-nums text-mana-400">{totals.exp}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">획득 Gold</dt>
                <dd className="tabular-nums text-gold-400">{totals.gold}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">HP 변화</dt>
                <dd className={`tabular-nums ${totals.hp < 0 ? 'text-vital-400' : 'text-slate-300'}`}>
                  {totals.hp}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">연속 수행일</dt>
                <dd className="tabular-nums text-slate-200">{streak}일</dd>
              </div>
              {metricToday.length > 0 && (
                <div className="border-t border-abyss-700 pt-2">
                  <dt className="mb-1 text-slate-400">오늘 기록</dt>
                  <dd className="text-xs text-slate-300">{metricToday.join(' · ')}</dd>
                </div>
              )}
            </dl>
          </Panel>

          {eggs.length > 0 && (
            <Panel title="품고 있는 알">
              <ul className="space-y-2">
                {eggs.map((egg) => (
                  <li key={egg.id} className="text-xs text-slate-300">
                    <div className="mb-1 flex justify-between">
                      <span>부화까지</span>
                      <span className="tabular-nums">
                        {egg.progress} / {egg.required}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-abyss-700">
                      <div
                        className="h-full bg-ember-400"
                        style={{ width: `${(egg.progress / egg.required) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </PageShell>
  )
}
