import { useState } from 'react'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { shiftMonth } from '../engine/calendar'
import { eventsOn, totalsForDate } from '../engine/ledger'
import { CalendarView } from '../features/history/CalendarView'
import { formatDisplayDate, getGameDate, type GameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'

const ACTION_LABEL = {
  complete: '완료',
  habit_positive: '좋은 습관',
  habit_negative: '나쁜 습관',
  miss_penalty: '미수행 피해',
  study_round: '회독',
} as const

export function HistoryPage() {
  const events = useGameStore((state) => state.events)
  const tasks = useGameStore((state) => state.tasks)
  const subjects = useGameStore((state) => state.subjects)

  const today = getGameDate(new Date())
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split('-').map(Number)
    return { year, month }
  })
  const [selected, setSelected] = useState<GameDate | null>(null)

  const allDates = [...new Set(events.map((event) => event.localDate))].sort((a, b) =>
    b.localeCompare(a),
  )
  const dates = selected ? allDates.filter((date) => date === selected) : allDates

  const titleOf = (id: string) =>
    tasks.find((task) => task.id === id)?.title ??
    subjects.find((subject) => subject.id === id)?.name ??
    '삭제된 항목'

  const metricTotals = events.reduce<Record<string, number>>((acc, event) => {
    if (event.metricValue && event.metricUnit && event.action !== 'study_round') {
      acc[event.metricUnit] = (acc[event.metricUnit] ?? 0) + event.metricValue
    }
    return acc
  }, {})

  return (
    <PageShell title="기록" description="게임 날짜(오전 8시 기준)별 수행 결과입니다.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col gap-4">
          <Panel title="달력">
            <CalendarView
              events={events}
              year={cursor.year}
              month={cursor.month}
              today={today}
              selected={selected}
              onSelect={setSelected}
              onShift={(delta) => setCursor(shiftMonth(cursor.year, cursor.month, delta))}
            />
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-3 w-full rounded-lg border border-abyss-700 py-1.5 text-xs text-slate-300 hover:bg-abyss-800"
              >
                {formatDisplayDate(selected)}만 보는 중 · 전체 보기
              </button>
            )}
          </Panel>

          {Object.keys(metricTotals).length > 0 && (
            <Panel title="기록 합계">
              <ul className="flex flex-wrap gap-2 text-sm">
                {Object.entries(metricTotals).map(([unit, total]) => (
                  <li key={unit} className="rounded-lg bg-abyss-800 px-3 py-1.5">
                    <span className="tabular-nums text-ember-400">
                      {Number(total.toFixed(1))}
                    </span>
                    <span className="ml-1 text-slate-400">{unit}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>

        <div className="flex flex-col gap-4">
          {dates.length === 0 ? (
            <EmptyState
              message={selected ? '이 날은 기록이 없습니다.' : '아직 기록이 없습니다.'}
              hint={
                selected
                  ? '달력에서 다른 날을 골라보세요.'
                  : '과제를 완료하거나 회독을 기록하면 이곳에 쌓입니다.'
              }
            />
          ) : (
            dates.map((date) => {
              const totals = totalsForDate(events, date)
              const dayEvents = eventsOn(events, date)
              const rounds = dayEvents.filter((event) => event.action === 'study_round').length

              return (
                <Panel
                  key={date}
                  title={`${formatDisplayDate(date)}${date === today ? ' · 오늘' : ''}`}
                >
                  <div className="mb-3 flex flex-wrap gap-3 text-xs">
                    <span className="text-mana-400">EXP {totals.exp}</span>
                    <span className="text-gold-400">Gold {totals.gold}</span>
                    <span className={totals.hp < 0 ? 'text-vital-400' : 'text-slate-400'}>
                      HP {totals.hp}
                    </span>
                    <span className="text-slate-400">완료 {totals.completions}회</span>
                    {rounds > 0 && <span className="text-ember-400">회독 {rounds}회</span>}
                  </div>

                  <ul className="divide-y divide-abyss-800">
                    {dayEvents.map((event) => (
                      <li key={event.id} className="flex items-center gap-3 py-1.5 text-sm">
                        <span className="w-20 shrink-0 text-[11px] text-slate-500">
                          {ACTION_LABEL[event.action]}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-slate-200">
                          {titleOf(event.taskId)}
                          {event.metricValue !== undefined && (
                            <span className="ml-2 text-xs text-ember-400">
                              {event.action === 'study_round'
                                ? `${event.metricValue}회독째`
                                : `${event.metricValue}${event.metricUnit}`}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums">
                          {event.expDelta > 0 && (
                            <span className="text-mana-400">+{event.expDelta}xp </span>
                          )}
                          {event.goldDelta > 0 && (
                            <span className="text-gold-400">+{event.goldDelta}G </span>
                          )}
                          {event.hpDelta !== 0 && (
                            <span className="text-vital-400">{event.hpDelta}HP</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )
            })
          )}
        </div>
      </div>
    </PageShell>
  )
}
