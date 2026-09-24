import type { GameDate } from '../lib/date'
import type { TaskEvent } from '../types/task'

/**
 * 이벤트 원장 조회 함수 모음.
 * "완료했는가", "오늘 몇 번 했는가"는 전부 여기를 통해 게임 날짜로 판단한다.
 */

/** 해당 게임 날짜에 이 과제를 완료했는가 */
export function hasCompletedOn(events: TaskEvent[], taskId: string, date: GameDate): boolean {
  return events.some(
    (event) => event.taskId === taskId && event.localDate === date && event.action === 'complete',
  )
}

/** 해당 게임 날짜에 이 습관을 기록한 횟수 */
export function countHabitEvents(
  events: TaskEvent[],
  taskId: string,
  date: GameDate,
  polarity: 'positive' | 'negative',
): number {
  const action = polarity === 'positive' ? 'habit_positive' : 'habit_negative'
  return events.filter(
    (event) => event.taskId === taskId && event.localDate === date && event.action === action,
  ).length
}

/** 해당 게임 날짜에 이미 미수행 피해를 받았는가 (중복 정산 방지용 2차 안전장치) */
export function hasMissPenaltyOn(events: TaskEvent[], taskId: string, date: GameDate): boolean {
  return events.some(
    (event) =>
      event.taskId === taskId && event.localDate === date && event.action === 'miss_penalty',
  )
}

export interface DayTotals {
  exp: number
  gold: number
  hp: number
  completions: number
}

/** 해당 게임 날짜의 획득/손실 합계 */
export function totalsForDate(events: TaskEvent[], date: GameDate): DayTotals {
  return events
    .filter((event) => event.localDate === date)
    .reduce<DayTotals>(
      (acc, event) => ({
        exp: acc.exp + event.expDelta,
        gold: acc.gold + event.goldDelta,
        hp: acc.hp + event.hpDelta,
        completions: acc.completions + (event.action === 'complete' ? 1 : 0),
      }),
      { exp: 0, gold: 0, hp: 0, completions: 0 },
    )
}

/** 해당 게임 날짜의 이벤트를 최신순으로 */
export function eventsOn(events: TaskEvent[], date: GameDate): TaskEvent[] {
  return events
    .filter((event) => event.localDate === date)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
