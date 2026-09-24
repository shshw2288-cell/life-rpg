import { describe, expect, it } from 'vitest'
import { LEVELING } from '../data/gameConfig'
import { applyExp, expForNextLevel } from './leveling'

describe('레벨 시스템', () => {
  it('레벨이 오를수록 필요 EXP가 늘어난다', () => {
    expect(expForNextLevel(1)).toBe(100)
    expect(expForNextLevel(2)).toBeGreaterThan(expForNextLevel(1))
  })

  it('필요 EXP에 못 미치면 레벨이 그대로다', () => {
    const result = applyExp(1, 0, 50)
    expect(result).toMatchObject({ level: 1, exp: 50, levelsGained: 0 })
  })

  it('필요 EXP를 채우면 레벨이 오르고 남은 EXP가 이월된다', () => {
    const result = applyExp(1, 90, 20)
    expect(result.level).toBe(2)
    expect(result.exp).toBe(10)
    expect(result.maxHpGained).toBe(LEVELING.hpPerLevel)
  })

  it('한 번에 여러 레벨이 오를 수 있다', () => {
    const result = applyExp(1, 0, 1000)
    expect(result.levelsGained).toBeGreaterThan(1)
    expect(result.exp).toBeLessThan(expForNextLevel(result.level))
  })

  it('최대 레벨을 넘지 않는다', () => {
    const result = applyExp(LEVELING.maxLevel, 0, 999999)
    expect(result.level).toBe(LEVELING.maxLevel)
  })

  it('음수 EXP는 무시한다', () => {
    expect(applyExp(3, 40, -100)).toMatchObject({ level: 3, exp: 40 })
  })
})
