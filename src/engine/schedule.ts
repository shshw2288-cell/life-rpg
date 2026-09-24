import { DIFFICULTY_TABLE, SETTLEMENT } from '../data/gameConfig'
import { addDays, diffDays, eachDay, weekdayOf, type GameDate } from '../lib/date'
import type { DailyTask, Task, TaskEvent } from '../types/task'
import { hasCompletedOn, hasMissPenaltyOn } from './ledger'

/** 이 게임 날짜에 이 반복 과제가 예정되어 있는가 */
export function isScheduledOn(task: DailyTask, date: GameDate): boolean {
  if (task.archivedAt) return false
  if (diffDays(task.createdOn, date) < 0) return false
  if (task.repeatDays.length === 0) return true
  return task.repeatDays.includes(weekdayOf(date))
}

/** 해당 게임 날짜에 해야 하는 반복 과제 목록 */
export function dailiesFor(tasks: Task[], date: GameDate): DailyTask[] {
  return tasks.filter(
    (task): task is DailyTask => task.type === 'daily' && isScheduledOn(task, date),
  )
}

export interface SettlementEntry {
  taskId: string
  title: string
  hpDelta: number
}

export interface SettlementDay {
  date: GameDate
  entries: SettlementEntry[]
  /** 상한 적용 전 피해 합계 */
  rawDamage: number
  /** 실제 적용할 피해 합계 */
  damage: number
}

export interface SettlementPlan {
  days: SettlementDay[]
  /** 소급 한도를 넘겨 정산하지 않고 건너뛴 날짜 수 */
  skippedDays: number
  totalDamage: number
}

/**
 * 놓친 반복 과제 정산 계획을 세운다. 상태를 바꾸지 않는 순수 함수다.
 *
 * - 대상 기간: lastSettledDate 다음 날 ~ 어제. 오늘은 아직 끝나지 않았으므로 정산하지 않는다.
 * - 이미 settlements에 있는 날짜, 이미 miss_penalty 이벤트가 있는 과제는 건너뛴다.
 * - 하루 피해는 최대 HP의 일정 비율을 넘지 않는다.
 * - 소급 일수가 maxCatchUpDays를 넘으면 최근 구간만 정산하고 나머지는 skippedDays로 보고한다.
 */
export function planSettlement(params: {
  tasks: Task[]
  events: TaskEvent[]
  settledDates: GameDate[]
  lastSettledDate: GameDate
  today: GameDate
  maxHp: number
}): SettlementPlan {
  const { tasks, events, settledDates, lastSettledDate, today, maxHp } = params
  const yesterday = addDays(today, -1)
  const firstCandidate = addDays(lastSettledDate, 1)

  if (diffDays(firstCandidate, yesterday) < 0) {
    return { days: [], skippedDays: 0, totalDamage: 0 }
  }

  const allDays = eachDay(firstCandidate, yesterday)
  const skippedDays = Math.max(0, allDays.length - SETTLEMENT.maxCatchUpDays)
  const targetDays = allDays.slice(skippedDays)
  const dailyCap = Math.floor(maxHp * SETTLEMENT.dailyDamageCapRatio)

  const days: SettlementDay[] = []

  for (const date of targetDays) {
    if (settledDates.includes(date)) continue

    const entries: SettlementEntry[] = []
    for (const task of dailiesFor(tasks, date)) {
      if (hasCompletedOn(events, task.id, date)) continue
      if (hasMissPenaltyOn(events, task.id, date)) continue
      entries.push({
        taskId: task.id,
        title: task.title,
        hpDelta: -DIFFICULTY_TABLE[task.difficulty].damage,
      })
    }

    if (entries.length === 0) {
      days.push({ date, entries: [], rawDamage: 0, damage: 0 })
      continue
    }

    const rawDamage = entries.reduce((sum, entry) => sum + Math.abs(entry.hpDelta), 0)
    days.push({ date, entries, rawDamage, damage: Math.min(rawDamage, dailyCap) })
  }

  return {
    days,
    skippedDays,
    totalDamage: days.reduce((sum, day) => sum + day.damage, 0),
  }
}

/**
 * 연속 수행일. 완료 이벤트가 하나라도 있는 게임 날짜가 며칠 연속되는지 센다.
 * 오늘 아직 아무것도 안 했다면 어제까지의 연속일을 유지한다.
 */
export function calcStreak(events: TaskEvent[], today: GameDate): number {
  const completedDates = new Set(
    events.filter((event) => event.action === 'complete').map((event) => event.localDate),
  )
  if (completedDates.size === 0) return 0

  let cursor = completedDates.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (completedDates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}
