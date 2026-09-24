import { DIFFICULTY_TABLE, HABIT_DIMINISHING, type Difficulty } from '../data/gameConfig'

export interface Reward {
  exp: number
  gold: number
  hp: number
}

/** 반복 과제·할 일 완료 보상 */
export function completionReward(difficulty: Difficulty): Reward {
  const row = DIFFICULTY_TABLE[difficulty]
  return { exp: row.exp, gold: row.gold, hp: 0 }
}

/**
 * 긍정 습관 보상. 같은 날 반복할수록 보상이 줄어든다.
 * todayCount는 이번 기록 직전까지의 당일 기록 횟수다.
 */
export function positiveHabitReward(difficulty: Difficulty, todayCount: number): Reward {
  const row = DIFFICULTY_TABLE[difficulty]
  if (!HABIT_DIMINISHING.enabled) {
    return { exp: row.exp, gold: row.gold, hp: 0 }
  }
  const raw = HABIT_DIMINISHING.factor ** Math.max(0, todayCount)
  const multiplier = Math.max(HABIT_DIMINISHING.floorRatio, raw)
  return {
    exp: Math.max(1, Math.round(row.exp * multiplier)),
    gold: Math.max(1, Math.round(row.gold * multiplier)),
    hp: 0,
  }
}

/** 부정 습관 피해. 반복할수록 피해가 커지지 않도록 기본 피해로 고정한다. */
export function negativeHabitPenalty(difficulty: Difficulty): Reward {
  return { exp: 0, gold: 0, hp: -DIFFICULTY_TABLE[difficulty].damage }
}
