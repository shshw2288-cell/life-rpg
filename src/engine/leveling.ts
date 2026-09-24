import { LEVELING } from '../data/gameConfig'

/** 해당 레벨에서 다음 레벨로 가는 데 필요한 EXP */
export function expForNextLevel(level: number): number {
  const capped = Math.min(level, LEVELING.maxLevel)
  return Math.round(LEVELING.baseExp * LEVELING.growth ** (capped - 1))
}

export interface LevelUpResult {
  level: number
  exp: number
  /** 이번 계산에서 오른 레벨 수 */
  levelsGained: number
  maxHpGained: number
}

/**
 * EXP를 더하고 레벨업을 처리한다. 상태를 바꾸지 않는 순수 함수.
 * 한 번에 여러 레벨이 오를 수 있다.
 */
export function applyExp(level: number, exp: number, gained: number): LevelUpResult {
  let nextLevel = level
  let nextExp = exp + Math.max(0, gained)
  let levelsGained = 0

  while (nextLevel < LEVELING.maxLevel && nextExp >= expForNextLevel(nextLevel)) {
    nextExp -= expForNextLevel(nextLevel)
    nextLevel += 1
    levelsGained += 1
  }

  if (nextLevel >= LEVELING.maxLevel) {
    nextLevel = LEVELING.maxLevel
    nextExp = Math.min(nextExp, expForNextLevel(LEVELING.maxLevel))
  }

  return {
    level: nextLevel,
    exp: nextExp,
    levelsGained,
    maxHpGained: levelsGained * LEVELING.hpPerLevel,
  }
}
