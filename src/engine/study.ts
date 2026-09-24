import { DIFFICULTY_TABLE, type Difficulty } from '../data/gameConfig'
import { STUDY } from '../data/studyConfig'
import type { GameDate } from '../lib/date'
import type { TaskEvent } from '../types/task'

/**
 * 회독 보상.
 * 같은 과목을 하루에 반복하면 보상이 줄어든다(습관과 같은 규칙).
 * todayCount는 이번 회독 직전까지 오늘 기록한 횟수다.
 */
export function roundReward(difficulty: Difficulty, todayCount: number) {
  const row = DIFFICULTY_TABLE[difficulty]
  const base = {
    exp: row.exp * STUDY.rewardRatio,
    gold: row.gold * STUDY.rewardRatio,
  }

  if (!STUDY.diminishing.enabled) {
    return { exp: Math.round(base.exp), gold: Math.round(base.gold), hp: 0 }
  }

  const raw = STUDY.diminishing.factor ** Math.max(0, todayCount)
  const multiplier = Math.max(STUDY.diminishing.floorRatio, raw)
  return {
    exp: Math.max(1, Math.round(base.exp * multiplier)),
    gold: Math.max(1, Math.round(base.gold * multiplier)),
    hp: 0,
  }
}

/** 해당 게임 날짜에 이 과목을 회독한 횟수 */
export function countRoundsOn(events: TaskEvent[], subjectId: string, date: GameDate): number {
  return events.filter(
    (event) =>
      event.taskId === subjectId && event.localDate === date && event.action === 'study_round',
  ).length
}

/** 해당 게임 날짜의 전체 회독 수 */
export function totalRoundsOn(events: TaskEvent[], date: GameDate): number {
  return events.filter((event) => event.localDate === date && event.action === 'study_round').length
}

/** 목표 회독을 이번에 채웠는가 */
export function justReachedTarget(rounds: number, target?: number): boolean {
  return target !== undefined && target > 0 && rounds === target
}
