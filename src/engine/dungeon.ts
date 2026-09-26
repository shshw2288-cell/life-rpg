import { DUNGEON_ENTRY } from '../data/battleConfig'
import type { GameDate } from '../lib/date'
import type { DungeonDay } from '../types/battle'
import type { TaskEvent } from '../types/task'

/**
 * 탑 입장 계산.
 *
 * 하루 입장 횟수에는 상한이 없다.
 *   - 무료 입장: 게임 날짜(오전 8시 기준)마다 1회
 *   - 열쇠: 과제를 완료해 모으며, 날짜가 바뀌어도 사라지지 않고 쌓인다
 *
 * 열쇠는 '완료' 이벤트로만 쌓인다. 습관 기록은 하루에 몇 번이든 누를 수 있어
 * 연타로 열쇠를 무한정 만들 수 있기 때문이다. 반복 과제와 할 일의 완료는
 * 과제당 하루 한 번뿐이라 자연스럽게 속도가 제한된다.
 */
export function countCompletionsOn(events: TaskEvent[], date: GameDate): number {
  return events.filter((event) => event.localDate === date && event.action === 'complete').length
}

export interface EntryStatus {
  /** 오늘 남은 무료 입장 */
  freeLeft: number
  /** 가진 열쇠 수 */
  keys: number
  /** 지금 들어갈 수 있는 총 횟수 */
  remaining: number
  /** 다음 열쇠까지 남은 과제 완료 수 */
  completionsToNextKey: number
}

export function entryStatus(params: {
  today: GameDate
  day: DungeonDay
  towerKeys: number
  /** 다음 열쇠까지 쌓인 완료 횟수 */
  keyProgress: number
}): EntryStatus {
  const { today, day, towerKeys, keyProgress } = params
  // 날짜가 바뀌었으면 무료 입장을 다시 채운다
  const usedToday = day.date === today ? day.entriesUsed : 0
  const freeLeft = Math.max(0, DUNGEON_ENTRY.baseDaily - usedToday)

  return {
    freeLeft,
    keys: towerKeys,
    remaining: freeLeft + towerKeys,
    completionsToNextKey: Math.max(1, DUNGEON_ENTRY.completionsPerKey - keyProgress),
  }
}

/** 과제 완료를 열쇠 적립에 반영한다. 순수 함수. */
export function addKeyProgress(
  keyProgress: number,
  towerKeys: number,
): { keyProgress: number; towerKeys: number; earned: number } {
  const next = keyProgress + 1
  const earned = Math.floor(next / DUNGEON_ENTRY.completionsPerKey)
  return {
    keyProgress: next % DUNGEON_ENTRY.completionsPerKey,
    towerKeys: towerKeys + earned,
    earned,
  }
}

/** 오늘 날짜에 맞춘 던전 기록. 날짜가 바뀌었으면 초기화한 값을 돌려준다. */
export function rollOverDay(day: DungeonDay, today: GameDate): DungeonDay {
  return day.date === today ? day : { date: today, entriesUsed: 0 }
}
