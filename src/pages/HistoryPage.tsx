import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { eventsOn, totalsForDate } from '../engine/ledger'
import { formatDisplayDate, getGameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'

const ACTION_LABEL = {
  complete: '완료',
  habit_positive: '좋은 습관',
  habit_negative: '나쁜 습관',
  miss_penalty: '미수행 피해',
} as const

export function HistoryPage() {
  const events = useGameStore((state) => state.events)
  const tasks = useGameStore((state) => state.tasks)
  const today = getGameDate(new Date())

  const dates = [...new Set(events.map((event) => event.localDate))].sort((a, b) =>
    b.localeCompare(a),
  )

  const titleOf = (taskId: string) =>
    tasks.find((task) => task.id === taskId)?.title ?? '삭제된 과제'

  /** 단위별 누적 합계 (운동 기록 등) */
  const metricTotals = events.reduce<Record<string, number>>((acc, event) => {
    if (event.metricValue && event.metricUnit) {
      acc[event.metricUnit] = (acc[event.metricUnit] ?? 0) + event.metricValue
    }
    return acc
  }, {})

  return (
    <PageShell title="기록" description="게임 날짜(오전 8시 기준)별 수행 결과입니다.">
      {Object.keys(metricTotals).length > 0 && (
        <div className="mb-4">
          <Panel title="기록 합계">
            <ul className="flex flex-wrap gap-4 text-sm">
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
        </div>
      )}

      {dates.length === 0 ? (
        <EmptyState
          message="아직 기록이 없습니다."
          hint="과제를 완료하면 이곳에 게임 날짜별로 쌓입니다."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((date) => {
            const totals = totalsForDate(events, date)
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
                </div>

                <ul className="divide-y divide-abyss-800">
                  {eventsOn(events, date).map((event) => (
                    <li key={event.id} className="flex items-center gap-3 py-1.5 text-sm">
                      <span className="w-20 shrink-0 text-[11px] text-slate-500">
                        {ACTION_LABEL[event.action]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-200">
                        {titleOf(event.taskId)}
                        {event.metricValue !== undefined && (
                          <span className="ml-2 text-xs text-ember-400">
                            {event.metricValue}
                            {event.metricUnit}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums">
                        {event.expDelta > 0 && <span className="text-mana-400">+{event.expDelta}xp </span>}
                        {event.goldDelta > 0 && <span className="text-gold-400">+{event.goldDelta}G </span>}
                        {event.hpDelta !== 0 && <span className="text-vital-400">{event.hpDelta}HP</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
