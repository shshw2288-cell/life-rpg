import { formatLocalDate, type GameDate } from '../lib/date'
import type { TaskEvent } from '../types/task'

export interface CalendarCell {
  date: GameDate
  day: number
  /** 이번 달에 속하는 날인지 (앞뒤 빈칸 채움용) */
  inMonth: boolean
}

/**
 * 한 달 달력 격자를 만든다. 일요일 시작, 항상 7칸 단위로 채운다.
 * month는 1~12.
 */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay()) // 그 주 일요일로 당긴다

  const cells: CalendarCell[] = []
  const cursor = new Date(start)

  // 6주(42칸)까지 돌되, 다음 달로 넘어간 주가 통째로 비면 멈춘다
  for (let index = 0; index < 42; index += 1) {
    cells.push({
      date: formatLocalDate(cursor),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === month - 1,
    })
    cursor.setDate(cursor.getDate() + 1)

    if (index % 7 === 6 && cursor.getMonth() !== month - 1 && cursor.getDate() > 7) break
  }

  return cells
}

export interface DayActivity {
  completions: number
  habits: number
  rounds: number
  exp: number
  gold: number
  hp: number
  /** 활동이 하나라도 있는가 */
  active: boolean
}

const EMPTY: DayActivity = {
  completions: 0,
  habits: 0,
  rounds: 0,
  exp: 0,
  gold: 0,
  hp: 0,
  active: false,
}

/** 게임 날짜별 활동 요약을 한 번에 만든다 */
export function activityByDate(events: TaskEvent[]): Map<GameDate, DayActivity> {
  const map = new Map<GameDate, DayActivity>()

  for (const event of events) {
    const current = map.get(event.localDate) ?? { ...EMPTY }
    map.set(event.localDate, {
      completions: current.completions + (event.action === 'complete' ? 1 : 0),
      habits:
        current.habits +
        (event.action === 'habit_positive' || event.action === 'habit_negative' ? 1 : 0),
      rounds: current.rounds + (event.action === 'study_round' ? 1 : 0),
      exp: current.exp + event.expDelta,
      gold: current.gold + event.goldDelta,
      hp: current.hp + event.hpDelta,
      active: true,
    })
  }

  return map
}

/** 활동량을 0~4 단계로 나눈다. 달력 색 농도에 쓴다. */
export function intensityOf(activity: DayActivity | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!activity || !activity.active) return 0
  const score = activity.completions * 2 + activity.rounds * 2 + activity.habits
  if (score >= 10) return 4
  if (score >= 6) return 3
  if (score >= 3) return 2
  return 1
}

/** 이전/다음 달 계산 */
export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}
