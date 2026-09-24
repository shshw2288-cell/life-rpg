import { ChevronLeft, ChevronRight } from 'lucide-react'
import { activityByDate, buildMonthGrid, intensityOf } from '../../engine/calendar'
import { WEEKDAY_LABELS, type GameDate } from '../../lib/date'
import type { TaskEvent } from '../../types/task'

const LEVEL_CLASS = [
  'bg-abyss-800/60',
  'bg-emerald-900/70',
  'bg-emerald-700/80',
  'bg-emerald-600',
  'bg-emerald-400',
] as const

interface CalendarViewProps {
  events: TaskEvent[]
  year: number
  month: number
  today: GameDate
  selected: GameDate | null
  onSelect: (date: GameDate | null) => void
  onShift: (delta: number) => void
}

export function CalendarView({
  events,
  year,
  month,
  today,
  selected,
  onSelect,
  onShift,
}: CalendarViewProps) {
  const cells = buildMonthGrid(year, month)
  const activity = activityByDate(events)

  const monthTotals = cells
    .filter((cell) => cell.inMonth)
    .reduce(
      (acc, cell) => {
        const day = activity.get(cell.date)
        if (!day) return acc
        return {
          days: acc.days + 1,
          completions: acc.completions + day.completions,
          rounds: acc.rounds + day.rounds,
          exp: acc.exp + day.exp,
        }
      },
      { days: 0, completions: 0, rounds: 0, exp: 0 },
    )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onShift(-1)}
          aria-label="이전 달"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-abyss-800 hover:text-slate-100"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <p className="text-sm font-semibold text-slate-100">
          {year}년 {month}월
        </p>
        <button
          type="button"
          onClick={() => onShift(1)}
          aria-label="다음 달"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-abyss-800 hover:text-slate-100"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={`pb-1 text-[11px] ${
              index === 0 ? 'text-vital-400' : index === 6 ? 'text-mana-400' : 'text-slate-500'
            }`}
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const day = activity.get(cell.date)
          const level = intensityOf(day)
          const isToday = cell.date === today
          const isSelected = cell.date === selected
          const damaged = (day?.hp ?? 0) < 0

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.inMonth}
              onClick={() => onSelect(isSelected ? null : cell.date)}
              aria-label={`${cell.date}${day ? ` 활동 ${day.completions + day.rounds + day.habits}건` : ' 활동 없음'}`}
              aria-pressed={isSelected}
              className={`relative aspect-square rounded-md border text-xs transition-colors ${
                cell.inMonth ? LEVEL_CLASS[level] : 'bg-transparent'
              } ${
                isSelected
                  ? 'border-ember-400'
                  : isToday
                    ? 'border-slate-400'
                    : 'border-transparent'
              } ${cell.inMonth ? 'hover:border-ember-500/70' : 'cursor-default'}`}
            >
              <span
                className={
                  !cell.inMonth
                    ? 'text-slate-700'
                    : level >= 3
                      ? 'font-semibold text-abyss-950'
                      : 'text-slate-300'
                }
              >
                {cell.day}
              </span>
              {damaged && (
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-vital-400"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
        <span>
          활동 {monthTotals.days}일 · 완료 {monthTotals.completions}회 · 회독 {monthTotals.rounds}회
        </span>
        <span className="flex items-center gap-1">
          적음
          {LEVEL_CLASS.map((className, index) => (
            <span key={index} className={`h-2.5 w-2.5 rounded-sm ${className}`} aria-hidden />
          ))}
          많음
        </span>
      </div>
    </div>
  )
}
