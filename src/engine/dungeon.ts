import { DUNGEON_ENTRY } from '../data/battleConfig'
import type { GameDate } from '../lib/date'
import type { DungeonDay } from '../types/battle'
import type { TaskEvent } from '../types/task'

/**
 * 던전 입장 횟수 계산.
 *
 * 입장 기회는 게임 날짜(오전 8시 기준)마다 초기화된다.
 * 추가 기회는 '완료' 이벤트로만 쌓인다. 습관 기록(habit_positive)은 세지 않는데,
 * 습관은 하루에 몇 번이든 누를 수 있어 연타로 입장권을 무한정 만들 수 있기 때문이다.
 * 반복 과제와 할 일의 완료는 과제당 하루 한 번뿐이라 자연스럽게 상한이 생긴다.
 */
export function countCompletionsOn(events: TaskEvent[], date: GameDate): number {
  return events.filter((event) => event.localDate === date && event.action === 'complete').length
}

export interface EntryStatus {
  /** 오늘 쓸 수 있는 총 입장 횟수 */
  total: number
  used: number
  remaining: number
  /** 기본 제공분 */
  base: number
  /** 과제 완료로 번 추가분 */
  earned: number
  /** 추가 1회까지 남은 완료 횟수 (더 받을 수 없으면 0) */
  completionsToNext: number
}

export function entryStatus(params: {
  today: GameDate
  day: DungeonDay
  completionsToday: number
}): EntryStatus {
  const { today, day, completionsToday } = params
  // 날짜가 바뀌었으면 사용 횟수는 0부터 다시 센다.
  const used = day.date === today ? day.entriesUsed : 0

  const earnedRaw = Math.floor(completionsToday / DUNGEON_ENTRY.completionsPerBonus)
  const total = Math.min(DUNGEON_ENTRY.maxDaily, DUNGEON_ENTRY.baseDaily + earnedRaw)
  const earned = total - DUNGEON_ENTRY.baseDaily

  const atMax = total >= DUNGEON_ENTRY.maxDaily
  const completionsToNext = atMax
    ? 0
    : DUNGEON_ENTRY.completionsPerBonus - (completionsToday % DUNGEON_ENTRY.completionsPerBonus)

  return {
    total,
    used,
    remaining: Math.max(0, total - used),
    base: DUNGEON_ENTRY.baseDaily,
    earned,
    completionsToNext,
  }
}

/** 오늘 날짜에 맞춘 던전 기록. 날짜가 바뀌었으면 초기화한 값을 돌려준다. */
export function rollOverDay(day: DungeonDay, today: GameDate): DungeonDay {
  return day.date === today ? day : { date: today, entriesUsed: 0 }
}
